import React from "react";
import moment from "moment-timezone";
import { Location, Wind } from "./types"
import { degreesToCompass } from "./utils";
import AlertButton from "./alertButton";
import AlertPopup from "./alertPopup";
import IconWeather from "./iconWeather";
import WeatherChart from "./weatherChart";
import styles from "./weatherPage.module.scss";

interface Props extends React.Props<any>
{
	location: Location;
}

interface State
{
}

class WeatherPage extends React.PureComponent<Props, State>
{
	constructor(
		props: Props)
	{
		super(props);
		this.m_alertPopup = React.createRef<AlertPopup>();
	}

	render()
	{
		let weather = this.props.location.weather;

		if(!weather)
			return <div>&nbsp;</div>;

		let temperatureChange = weather.todayHighTemperature - weather.yesterdayHighTemperature;

		return (
			<div className={styles.root}>
				<div className={styles.sectionBox}>
					{(weather.alerts.length > 0) &&
						<div className={styles.alert}>
							<AlertButton alerts={weather.alerts} onClick={e => this.m_alertPopup.current!.show()}/>
							<AlertPopup weather={weather} ref={this.m_alertPopup}/>
						</div>
					}
					<div className={styles.flex50}>
						<div className={styles.currentTempBox}>
							<div className={styles.currentTemperature}>{weather.currentTemperature.toFixed(0)}°</div>
							<div className={styles.apparentTemperature}>
								<label>Feels Like: </label>
								{weather.apparentTemperature.toFixed(0)}°
							</div>
						</div>
						<div className={styles.currentCondBox}>
							<div className={styles.currentConditionsIcon}>
								<IconWeather condition={weather.currentConditionsIcon}/>
							</div>
							<div>{weather.currentConditions}</div>
						</div>
					</div>
					<div className={styles.flex50}>
						<div className={styles.currentHumidity}>
							<label>Humidity: </label>
							{(weather.currentHumidity * 100).toFixed(0)}%
						</div>
						<div className={styles.currentWind}>
							<label>Wind: </label>
							{this.renderWind(weather.currentWind)}
						</div>
					</div>
				</div>

				<div className={styles.sectionHdr}>Today's Forecast</div>
				<div className={styles.sectionBox}>
					<div className={styles.flex50}>
						<div className={styles.todayTempBox}>
							<span className={styles.hiTemp}>{weather.todayHighTemperature.toFixed(0)}°</span>
							<span className={styles.loTemp}>{weather.todayLowTemperature.toFixed(0)}°</span>
						</div>
						<div className={styles.todayCondBox}>
							<div>
								<label>{weather.todayPrecipType}: </label>
								{(weather.todayPrecipProb * 100).toFixed(0)}%
							</div>
						</div>
					</div>
					<div className={styles.todayForecastBox}>
						{ (Math.abs(temperatureChange) < 1) ?
								"About the same temperature today. " :
								Math.abs(temperatureChange).toFixed(0) + "° " + ((temperatureChange > 0) ? "warmer today. " : "cooler today. ")
						}
						{weather.todayConditions + " "}
						{ ((Math.round(weather.todayPrecipAccum * 10) / 10) >= 0.5) ?
								`Snow accumulation ${weather.todayPrecipAccum.toFixed(1)} inches. ` :
								""
						}
						<span>Wind </span>
						{this.renderWind(weather.todayWind)} mph.
					</div>
				</div>

				<div className={styles.sectionHdr}>Seven Day Forecast</div>
				<WeatherChart location={this.props.location}/>

				<div className={styles.lastUpdated}>
					Last updated {moment(weather.timestamp).format("MMM D, h:mm A z")}
				</div>

				<div className={styles.poweredBy}>
					<a href="https://darksky.net/poweredby/" target="_blank" rel="noopener noreferrer">Powered by Dark Sky</a>
				</div>
			</div>
		)
	}

	private renderWind(
		windData: Wind)
	{
		if(windData.speed === 0)
			return <span>Calm</span>;

		let currentWindSpeed = Math.round(windData.speed);
		let currentWindGust = Math.round(windData.gust);

		let windMessage = degreesToCompass(windData.bearing) + " " + currentWindSpeed;

		if(currentWindGust !== currentWindSpeed)
			windMessage += " - " + currentWindGust;

		return <span>{windMessage}</span>;
	}

	private m_alertPopup: React.RefObject<AlertPopup>;
}

export default WeatherPage;
