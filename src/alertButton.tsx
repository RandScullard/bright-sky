import React from "react";
import { WeatherAlert } from "./types";
import IconAlert from "./iconAlert";
import styles from "./alertButton.module.scss";

export default function AlertButton(props: {
	alerts: WeatherAlert[],
	onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
})
{
	// Render the title of the first alert, with " +n" if there are multiple alerts.
	return (
		<button className={styles.alertButton} onClick={e => props.onClick(e)}>
			<IconAlert/>
			<span>
				{ props.alerts[0].title }
				{ ((props.alerts.length > 1) ? ` +${props.alerts.length - 1}` : "") }
			</span>
		</button>
	);
}
