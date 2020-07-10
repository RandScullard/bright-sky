import * as React from "react";
import styles from "./spinner.module.scss";

export default function Spinner()
{
	// The number of child divs must match the number specified for $numBars in spinner.module.css.
	return <div className={styles.spinner}>
		<div/><div/><div/><div/>
		<div/><div/><div/><div/>
		<div/><div/><div/><div/>
	</div>;
}