import React from "react";
import ReactDOM from "react-dom";
import { CSSTransition } from "react-transition-group";
import styles from "./modal.module.scss";
import IconClose from "./iconClose";

interface Props extends React.Props<any>
{
	title: string;
	onShow?: () => void;
	onHide?: () => void;
}

interface State
{
	isVisible: boolean;
}

// The Modal uses a React Portal to create itself at the top level of the document, rather than as a child
// of the element where it is declared. It uses a CSSTransition to slide up from the bottom of the screen
// when displayed and slide back down again when hidden. Note that the children of the Modal will fire
// componentDidMount when the Modal mounts, not when it is shown, and componentWillUnmount when the Modal
// unmounts, not when it is hidden. Therefore, any setup/teardown the children need to do against the DOM
// must be done in the onShow/onHide handler rather than in componentDidMount/componentWillUnmount.
class Modal extends React.Component<Props, State>
{
	constructor(
		props: Props)
	{
		super(props);
		this.m_containerElem = document.createElement("div");

		this.state = {
			isVisible: false
		}
	}

	render()
	{
		// Note that by specifying classNames={{...styles}} to the CSSTransition, we automatically pick up the
		// modal.module.scss classes named enter, enterActive, exit, and exitActive. Note also that the specified
		// timeout must match the transition timeout specified on these classes.
		let rootElem = (
			<CSSTransition in={this.state.isVisible} timeout={300} mountOnEnter unmountOnExit classNames={{...styles}}>
				<div className={styles.blocker}>
					<div className={styles.frame}>
						<div className={styles.titleBar}>
							<div className={styles.closeButton}>
								<button onClick={e => this.hide()}>
									<IconClose/>
								</button>
							</div>
							<div className={styles.title}>{this.props.title}</div>
						</div>
						<div className={styles.body}>
							{this.props.children}
						</div>
					</div>
				</div>
			</CSSTransition>
		);

		return ReactDOM.createPortal(rootElem, this.m_containerElem);
	}

	componentDidMount()
	{
		document.body.appendChild(this.m_containerElem);
	}

	componentWillUnmount()
	{
		document.body.removeChild(this.m_containerElem);
	}

	componentDidUpdate(
		prevProps: Props,
		prevState: State)
	{
		if(this.state.isVisible !== prevState.isVisible)
		{
			if(this.state.isVisible)
			{
				if(this.props.onShow != null)
					this.props.onShow();
			}
			else
			{
				if(this.props.onHide != null)
					this.props.onHide();
			}
		}
	}

	show()
	{
		this.setState({ isVisible: true });
	}

	hide()
	{
		this.setState({ isVisible: false });
	}

	private m_containerElem: HTMLDivElement;
}

export default Modal;
