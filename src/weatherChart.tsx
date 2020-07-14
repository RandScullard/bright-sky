import React from "react";
import * as Highcharts from "highcharts";
import "highcharts/css/highcharts.css";
import HighchartsReact from "highcharts-react-official";
import moment from "moment-timezone";
import { Location } from "./types";
import IconWeather from "./iconWeather";
import styles from "./weatherChart.module.scss";

interface Props extends React.Props<any>
{
	location: Location;
}

interface State
{
}

// This width allows a chart nine days wide (9 * 63 = 567) to just fit on an iPhone 5 screen in landscape orientation (568 pixels wide):
const DAY_WIDTH = 63; // pixels

class WeatherChart extends React.Component<Props, State>
{
	constructor(
		props: Props)
	{
		super(props);
		this.m_scrollerElem = React.createRef<HTMLDivElement>();
	}

	render()
	{
		let weather = this.props.location.weather;

		if(!weather)
			return <div/>;

		const oneDay = 24 * 60 * 60 * 1000;

		const hcOptions: Highcharts.Options = {
			chart: {
				height: 100,
				width: weather.dailyChartData.length * DAY_WIDTH,
				margin: [5, 0, 5, 0],
				animation: false,
				styledMode: true,
				className: styles.highchartsWeatherChart,
			},
			title: { text: undefined },
			tooltip: { enabled: false },
			legend: { enabled: false },
			credits: { enabled: false },
			plotOptions: {
				series: {
					animation: false,
					states: { hover: { enabled: false } }
				}
			},
			time: {
				// We want the chart rendered in the weather location's local time zone:
				getTimezoneOffset: timestamp => -moment.tz(timestamp, weather!.timezone).utcOffset()
			},
			xAxis: {
				type: "datetime", 
				title: undefined,
				tickLength: 0,
				labels: { enabled: false },
				// Since the x axis has to line up with the HTML content we display above each day,
				// the following settings are used to turn off the usual Highcharts adjustments to the x axis
				// and put everything under manual control:
				min: weather.dailyChartData[0].time,
				max: weather.dailyChartData[weather.dailyChartData.length - 1].time + oneDay,
				tickInterval: oneDay,
				startOnTick: false,
				endOnTick: false,
				minPadding: 0,
				maxPadding: 0,
			},
			yAxis: [{
				title: undefined,
				tickInterval: 5,
				startOnTick: false,
				endOnTick: false,
				labels: {
					align: "left",
					x: DAY_WIDTH + 5,
				}
			},{
				// The secondary y axis is for precipitation. Since it's implicitly a 0 - 100% value, we can hide this axis.
				title: undefined,
				visible: false,
				opposite: true,
			}],
			series: [{
				type: "areaspline",
				name: "Precipitation",
				className: styles.precipSeries,
				yAxis: 1,
				// Zones are used to render the future in a different color from the past:
				zoneAxis: "x",
				zones: [ { value: moment().valueOf() } ],
				data: weather.precipChartData.map(point => [point.time, Math.round(point.value * 100)])
			},{
				type: "spline",
				name: "Temperature",
				className: styles.temperatureSeries,
				// Zones are used to render the future in a different color from the past:
				zoneAxis: "x",
				zones: [ { value: moment().valueOf() } ],
				data: weather.temperatureChartData.map(point => [point.time, point.value])
			}]
		}

		let getDayOfWeek = (time: number) =>
		{
			// Display today as "Today" and any other day as, for example, "Wed 15". Note that we have to format
			// the time relative to the weather location's local time zone.
			let now = moment().valueOf();
			let timeInTz = moment(time).tz(weather!.timezone);
			return ((now - time > 0) && (now - time < oneDay)) ?
				<span>Today</span> :
				<span>{timeInTz.format("ddd")} <span className={styles.dayNum}>{timeInTz.format("D")}</span></span>;
		}

		return (
			<div className={`${styles.chartScroller} scroller`} ref={this.m_scrollerElem}>
				<div>
					<div className={styles.chartHeaders}>
						{ weather.dailyChartData.map((day, idx) =>
							<div key={idx} className={styles.day}>
								<div className={styles.date}>
									{getDayOfWeek(day.time)}
								</div>
								<div className={styles.conditionsIcon}>
									<IconWeather condition={day.conditionsIcon}/>
								</div>
								<div className={styles.temps}>
									<span className={styles.hiTemp}>{day.highTemperature.toFixed(0)}°</span>
									<span className={styles.loTemp}>{day.lowTemperature.toFixed(0)}°</span>
								</div>
							</div>
						)}
					</div>
					<HighchartsReact highcharts={Highcharts} options={hcOptions}/>
				</div>
			</div>
		)
	}

	componentDidMount()
	{
		// On mount, scroll the chart scroller to the right just enough to hide yesterday and make today the
		// first day visible. If the user wants to see yesterday (a less common use case) they can scroll to the left.
		if(this.m_scrollerElem.current != null)
			this.m_scrollerElem.current.scrollLeft = DAY_WIDTH;
	}

	private m_scrollerElem: React.RefObject<HTMLDivElement>;
}

export default WeatherChart;