import React from "react";
import moment from "moment-timezone";
import Swipe from "swipejs";
import { Weather } from "./types";
import Modal from "./modal";
import PageDots from "./pageDots";
import styles from "./alertPopup.module.scss";

interface Props
{
	weather: Weather;
}

interface State
{
	currAlert: number;
}

class AlertPopup extends React.Component<Props, State>
{
	constructor(
		props: Props)
	{
		super(props);
		this.m_modal = React.createRef<Modal>();
		this.m_swipeElem = React.createRef<HTMLDivElement>();
		this.m_swipe = null;

		this.state = {
			currAlert: 0
		};
	}

	render()
	{
		const timeFormat = "MMM D, h:mm A z";

		return (
			<Modal
				title={this.props.weather.alerts[this.state.currAlert].title}
				onShow={() => this.onModalShow()}
				onHide={() => this.onModalHide()}
				ref={this.m_modal}
			>
				<div className={styles.layout}>
					{(this.props.weather.alerts.length > 1) &&
						<PageDots numDots={this.props.weather.alerts.length} currDot={this.state.currAlert}/>
					}
					<div className={styles.swipe} ref={this.m_swipeElem}>
						<div className={styles.swipeWrap}>
							{ this.props.weather.alerts.map((alert, idx) =>
								<div key={idx}>
									<div className={styles.body}>
										<table className={styles.times}>
											<tbody>
												<tr>
													<td>Effective:</td>
													<td>{moment.tz(alert.time, this.props.weather.timezone).format(timeFormat)}</td>
												</tr>
												<tr>
													<td>Expires:</td>
													<td>{moment.tz(alert.expires, this.props.weather.timezone).format(timeFormat)}</td>
												</tr>
											</tbody>
										</table>
										<div>{alert.description}</div>
										<div className={styles.moreInfo}>
											<a href={alert.uri} target="_blank" rel="noopener noreferrer">More Info</a>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</Modal>
		);
	}

	private onModalShow()
	{
		// When this modal is reopened, we want it to reset back to the first alert.
		this.setState({ currAlert: 0 });

		this.m_swipe = new Swipe(
			this.m_swipeElem.current!, 
			{
				startSlide: 0,
				continuous: false,
				draggable: true,
				disableScroll: false,
				stopPropagation: false,
				transitionEnd: async (index, elem) =>
				{
					this.setState({ currAlert: index });
				}
			}
		);
	}

	private onModalHide()
	{
		this.m_swipe!.kill();
	}

	show()
	{
		this.m_modal.current!.show();
	}

	private m_modal: React.RefObject<Modal>;
	private m_swipeElem: React.RefObject<HTMLDivElement>;
	private m_swipe: Swipe | null;
}

export default AlertPopup;
