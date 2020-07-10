import React from "react";
import styles from "./pageDots.module.scss";

// This component displays the UI popularized by iOS, where a horizontal row of dots showing the total
// number of pages through which the user can swipe horizontally. The dot representing the current
// page is highlighted to give the user a sense of location.
export default function PageDots(props: {
	numDots: number,
	currDot: number
})
{
	return (
		<div className={styles.dots}>
			{ new Array(props.numDots).fill(null).map((n, idx) =>
				<div key={idx} className={`${styles.dot} ${(idx === props.currDot) ? styles.current : ""}`}/>
			)}
		</div>
	);
}

