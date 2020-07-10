import React from "react";
import update from "immutability-helper";
import moment from "moment-timezone";
import Swipe from "swipejs";
import config from "./config";
import { Location, Weather, WeatherAlert } from "./types"
import PageDots from "./pageDots";
import SettingsPopup from "./settingsPopup";
import WeatherPage from "./weatherPage";
import IconRefresh from "./iconRefresh";
import IconSettings from "./iconSettings";
import Spinner from "./spinner";
import styles from "./app.module.scss";

// Whenever there is a breaking change to the persistent state, increment this version number.
// This will cause the code to ignore the old persistent state and start fresh with defaults.
const PERSIST_STATE_VERSION = 21;

interface PersistState
{
	version: number;
	locations: Location[];
	currLocation: number;
}

interface Props extends React.Props<any>
{
}

interface State
{
	persistState: PersistState;
	isBusy: boolean;
}

class App extends React.Component<Props, State>
{
	constructor(
		props: Props)
	{
		super(props);
		this.m_swipeElem = React.createRef<HTMLDivElement>();
		this.m_settingsPopup = React.createRef<SettingsPopup>();
		this.m_swipe = null;
		this.m_unmountCleanup = () => null;

		let persistState: PersistState | null = null;

		let json = window.localStorage.getItem("app_persistState");
		if(json)
			persistState = JSON.parse(json);

		if(persistState && (persistState.version !== PERSIST_STATE_VERSION))
			persistState = null;

		if(!persistState)
		{
			// If the persistent state is missing or has an old version number, use these defaults.
			persistState = {
				version: PERSIST_STATE_VERSION,
				locations: [{
					name: "New York, NY 10025, USA",
					latitude: 40.7999209,
					longitude: -73.96831019999999,
					weather: null
				}],
				currLocation: 0
			};
		}

		this.state = {
			persistState: persistState,
			isBusy: false,
		};
	}

	render()
	{
		let locations = this.state.persistState.locations;

		return (
			<div className={styles.root}>
				<div className={styles.locationHdr}>
					<div className={`${styles.locationTitle} ${(locations.length <= 1) && styles.noPageDots}`}>
						{(locations.length > 0) ?
							locations[this.state.persistState.currLocation].name :
							<span>&nbsp;</span>
						}
					</div>
					{(locations.length > 1) && 
						<PageDots numDots={locations.length} currDot={this.state.persistState.currLocation}/>
					}
					<div className={styles.settings}>
						<button onClick={e => this.m_settingsPopup.current!.show()}>
							<IconSettings/>
						</button>
						<SettingsPopup
							initialLocations={locations}
							ref={this.m_settingsPopup}
							onSave={locations => this.onSettingsPopupSave(locations)}
						/>
					</div>
					<div className={styles.refresh}>
						<button onClick={e => this.refreshWeatherData(true)}>
							<IconRefresh/>
						</button>
					</div>
				</div>
				<div className={styles.body}>
					<div className={styles.swipe} ref={this.m_swipeElem}>
						<div className={styles.swipeWrap}>
							{(locations.length > 0) ?
								locations.map((location, idx) =>
									<WeatherPage location={location} key={idx}/>
								)
							:
								<div className={styles.noLocations}>Please add one or more weather locations in Settings</div>
							}
						</div>
					</div>
				</div>
				{ this.state.isBusy && 
					<div className={styles.blocker}>
						<Spinner/>
					</div>
				}
			</div>
		);
	}

	componentDidMount()
	{
		// Set up the Swipe control that allows the user to swipe horizontally between weather locations.
		this.setupSwipe();

		// Once per minute, check whether the weather data for the currently displayed location is out of date,
		// and if so, kick off a refresh. This is really for the use case where the app has been paused in the background
		// for more than an hour and the user brings it to the foreground - it will immediately refresh.
		let intervalID = window.setInterval(() => this.refreshWeatherData(false), 60 * 1000);

		this.m_unmountCleanup = () =>
		{
			this.m_swipe!.kill();
			window.clearInterval(intervalID);
		}

		// If the weather data for the currently displayed location is out of date, kick off a refresh.
		this.refreshWeatherData(false);
	}

	componentWillUnmount()
	{
		this.m_unmountCleanup();
	}

	private setupSwipe()
	{
		// Note that we tell Swipe to ignore any gestures in the scroller for the weather chart;
		// it has its own horizontal scrolling that works independently from swiping the entire page.
		this.m_swipe = new Swipe(
			this.m_swipeElem.current!,
			{
				startSlide: this.state.persistState.currLocation,
				continuous: false,
				draggable: true,
				disableScroll: false,
				stopPropagation: false,
				ignore: ".scroller *",
				transitionEnd: async (index, elem) =>
				{
					let newPersistState = update(this.state.persistState, { currLocation: { $set: index } });
					await this.setPersistState(newPersistState);

					// Whenever the user swipes to a new location, refresh its weather data if it is out of date.
					this.refreshWeatherData(false);
				}
			}
		);
	}

	private async refreshWeatherData(
		forceRefresh: boolean)
	{
		try
		{
			// If there are no locations, or currLocation is somehow out of range, there's nothing to do.
			let location = this.state.persistState.locations[this.state.persistState.currLocation];
			if(!location)
				return;

			const now = moment();

			// If we aren't forcing a refresh and the weather data is fresh enough, there's nothing to do.
			const timeout = 60 * 60 * 1000; // one hour
			if(!forceRefresh && location.weather && ((now.valueOf() - location.weather.timestamp) < timeout))
				return;

			// Show the spinner and block the page.
			this.setState({isBusy: true});

			// We want to display continuous hourly conditions from yesterday at 12:00 midnight through 48 hours from now, and daily
			// conditions for the next seven days. Unfortunately, to display all this, we need to request three batches of
			// data from the API...

			// Batch 1: Current data: This includes current conditions, hourly conditions for the current hour through the next 48 hours,
			// daily conditions for today through the next seven days, and current alerts.
			let currentResp = await window.fetch(`${config.forecastUrl}/${location.latitude},${location.longitude}?exclude=minutely`);
			let currentData = await currentResp.json();
			console.log(currentData);

			// Batch 2: Today's data: This includes hourly conditions for all of today (12:00 midnight this morning through 11:00 tonight).
			let todayResp = await window.fetch(`${config.forecastUrl}/${location.latitude},${location.longitude},${now.unix()}?exclude=currently,minutely,daily,alerts,flags`);
			let todayData = await todayResp.json();
			console.log(todayData);

			// Batch 3: Yesterday's data: This includes daily conditions for yesterday and hourly conditions for all of yesterday
			// (12:00 midnight through 11:00 pm).
			let yesterday = now.clone().subtract(1, "days");
			let yesterdayResp = await window.fetch(`${config.forecastUrl}/${location.latitude},${location.longitude},${yesterday.unix()}?exclude=currently,minutely,alerts,flags`);
			let yesterdayData = await yesterdayResp.json();
			console.log(yesterdayData);

			// Grab any alerts from the current data and map them into our format. Note that if there are no alerts, the whole
			// alerts field will be missing from the current data.
			let alerts: WeatherAlert[] =
				currentData.alerts ?
					(currentData.alerts as WeatherAlert[]).map(alert => ({
						title: alert.title,
						regions: alert.regions,
						severity: alert.severity,
						time: alert.time * 1000,
						expires: alert.expires * 1000,
						description: alert.description,
						uri: alert.uri,
					})) :
					[];

			// Build the data that drives the weather chart - this is the complicated bit.
			let dailyChartData = this.buildDailyChartData(currentData, yesterdayData);
			let temperatureChartData = this.buildTemperatureChartData(currentData, todayData, yesterdayData);
			let precipChartData = this.buildPrecipChartData(currentData, todayData, yesterdayData);

			// Populate our entire weather data structure.
			let weather: Weather = {
				timestamp: now.valueOf(),
				timezone: currentData.timezone,
				currentConditions: currentData.currently.summary,
				currentConditionsIcon: currentData.currently.icon,
				currentTemperature: currentData.currently.temperature,
				apparentTemperature: currentData.currently.apparentTemperature,
				currentHumidity: currentData.currently.humidity,
				currentWind: {
					bearing: currentData.currently.windBearing,
					speed: currentData.currently.windSpeed,
					gust: currentData.currently.windGust,
				},
				todayConditions: currentData.daily.data[0].summary,
				todayHighTemperature: currentData.daily.data[0].temperatureHigh,
				todayLowTemperature: currentData.daily.data[0].temperatureLow,
				todayPrecipProb: currentData.daily.data[0].precipProbability,
				todayPrecipType: currentData.daily.data[0].precipType ?? "rain",
				todayPrecipAccum: currentData.daily.data[0].precipAccumulation ?? 0,
				todayWind: {
					bearing: currentData.daily.data[0].windBearing,
					speed: currentData.daily.data[0].windSpeed,
					gust: currentData.daily.data[0].windGust,
				},
				yesterdayHighTemperature: yesterdayData.daily.data[0].temperatureHigh,
				alerts: alerts,
				dailyChartData: dailyChartData,
				temperatureChartData: temperatureChartData,
				precipChartData: precipChartData,
			};

			// Store the entire weather structure in persistent data.
			let newPersistState = update(
				this.state.persistState,
				{ locations: { [this.state.persistState.currLocation]: { weather: { $set: weather } } } });

			return this.setPersistState(newPersistState);
		}
		catch(err)
		{
			window.alert(err.message);
		}
		finally
		{
			// Hide the spinner and unblock the page.
			this.setState({isBusy: false});
		}
	}

	private buildDailyChartData(
		currentData: any,
		yesterdayData: any)
	{
		// The chart has a header for each day with the daily conditions (high/low temps, conditions icon, etc.).

		interface DayEntry
		{
			time: number;
			icon: string;
			temperatureHigh: number;
			temperatureLow: number;
			precipProbability: number;
		}

		// The chart spans from yesterday through seven days from now, so we need the dailies from yesterday and current.
		let days = (yesterdayData.daily.data as DayEntry[]).concat(currentData.daily.data as DayEntry[]);

		return days.map(day => ({
			time: day.time * 1000, // unix -> javascript
			conditionsIcon: day.icon,
			highTemperature: day.temperatureHigh,
			lowTemperature: day.temperatureLow,
			precipProb: day.precipProbability,
		}));
	}

	private buildTemperatureChartData(
		currentData: any,
		todayData: any,
		yesterdayData: any)
	{
		interface SingleTempEntry
		{
			time: number;
			temperature: number;
		}

		interface HighLowTempEntry
		{
			temperatureHigh: number;
			temperatureHighTime: number;
			temperatureLow: number;
			temperatureLowTime: number;
		}

		// Start with the hourlies from yesterday (midnight to 11 pm) and concatenate the hourlies from today
		// (also midnight to 11 pm).
		let temperatures =
			(yesterdayData.hourly.data as SingleTempEntry[]).map(entry => ({ time: entry.time, temperature: entry.temperature }))
				.concat((todayData.hourly.data as SingleTempEntry[]).map(entry => ({ time: entry.time, temperature: entry.temperature })));

		let latestTime = temperatures[temperatures.length - 1].time;

		// Now take the hourlies from current (now through 48 hours from now) and concatenate those on.
		// Ignore any hourlies that overlap with ones we already have from the prior step.
		temperatures =
			temperatures.concat(
				(currentData.hourly.data as SingleTempEntry[])
					.filter(entry => entry.time > latestTime)
					.map(entry => ({ time: entry.time, temperature: entry.temperature })));

		latestTime = temperatures[temperatures.length - 1].time;

		// Next, take the daily high temps from current (today through seven days from now) and concatenate those on.
		// Use the temperatureHighTime to position the high temps along the time axis.
		// Ignore any times that overlap with the hourlies we already have from the prior steps.
		temperatures =
			temperatures.concat(
				(currentData.daily.data as HighLowTempEntry[])
					.filter(entry => entry.temperatureHighTime > latestTime)
					.map(entry => ({ time: entry.temperatureHighTime, temperature: entry.temperatureHigh })));

		// Next, take the daily low temps from current (today through seven days from now) and concatenate those on.
		// Use the temperatureLowTime to position the low temps along the time axis.
		// Ignore any times that overlap with the hourlies we already have from the prior steps.
		temperatures =
			temperatures.concat(
				(currentData.daily.data as HighLowTempEntry[])
					.filter(entry => entry.temperatureLowTime > latestTime)
					.map(entry => ({ time: entry.temperatureLowTime, temperature: entry.temperatureLow })));

		// And sort the whole thing chronologically, since some of the preceding operations generated points out of order.
		temperatures = temperatures.sort((a, b) => a.time - b.time);

		return temperatures.map(entry => ({
			time: entry.time * 1000, // unix -> javascript
			value: entry.temperature
		}));
	}

	private buildPrecipChartData(
		currentData: any,
		todayData: any,
		yesterdayData: any)
	{
		interface PrecipEntry
		{
			time: number;
			precipProbability: number;
		}

		// Start with the hourlies from yesterday (midnight to 11 pm) and concatenate the hourlies from today
		// (also midnight to 11 pm).
		let precips =
			(yesterdayData.hourly.data as PrecipEntry[]).map(entry => ({ time: entry.time, precipProbability: entry.precipProbability }))
				.concat((todayData.hourly.data as PrecipEntry[]).map(entry => ({ time: entry.time, precipProbability: entry.precipProbability })));

		let latestTime = precips[precips.length - 1].time;

		// Now take the hourlies from current (now through 48 hours from now) and concatenate those on.
		// Ignore any hourlies that overlap with ones we already have from the prior step.
		precips =
			precips.concat(
				(currentData.hourly.data as PrecipEntry[])
					.filter(entry => entry.time > latestTime)
					.map(entry => ({ time: entry.time, precipProbability: entry.precipProbability})));

		// Since we get 48 hours of hourly data, the last day of hourly data may be incomplete.
		// The chart is misleading when it shows a partial day of hourly data, so remove any hourly data points
		// for that last incomplete day -- that day will show daily data instead.
		let lastTime = moment.unix(precips[precips.length - 1].time).tz(currentData.timezone);
		let lastDate = lastTime.clone().startOf("day");
		if(lastTime.diff(lastDate, "hours") < 23)
			precips = precips.filter(entry => entry.time < lastDate.unix());

		latestTime = precips[precips.length - 1].time;

		// Now grab the daily data...
		// Ignore any dailies that overlap with data we already have from the prior step.
		let dailyPrecips =
			(currentData.daily.data as PrecipEntry[])
				.filter(entry => entry.time > latestTime)
				.map(entry => ({ time: entry.time, precipProbability: entry.precipProbability }));

		// And extend each daily data point to the start of the following day, less one second.
		// Since each daily data point is timestamped at the start of the day (00:00 midnight),
		// this gives us a horizontal line extending across the entire day.
		dailyPrecips =
			dailyPrecips.concat(
				dailyPrecips.map(entry => ({
					time: moment.unix(entry.time).tz(currentData.timezone).add(1, "days").unix() - 1, 
					precipProbability: entry.precipProbability
				})
			)
		);

		// And sort the whole thing chronologically, since some of the preceding operations generated points out of order.
		precips = precips.concat(dailyPrecips).sort((a, b) => a.time - b.time);

		return precips.map(entry => ({
			time: entry.time * 1000, // unix -> javascript
			value: entry.precipProbability
		}));
	}

	private async onSettingsPopupSave(
		locations: Location[])
	{
		// Clone the locations array passed from the settings popup so we can manipulate it.
		let newLocations: Location[] = locations.map(loc => ({
			name: loc.name,
			latitude: loc.latitude,
			longitude: loc.longitude,
			weather: null,
		}));

		// Remember the name of the currently selected location. This allows us to preserve
		// the currently selected location (by name) even if the user reorders the locations array.
		let currLocationName = "";
		if(this.state.persistState.locations.length > 0)
			currLocationName = this.state.persistState.locations[this.state.persistState.currLocation].name;

		// Walk through the new locations array and get the new index of the currently selected location (by name).
		// Also grab the existing weather data (if any) from the old locations array (matching by name).
		let newCurrLocation = 0;
		for(let i = 0; i < newLocations.length; i++)
		{
			if(newLocations[i].name === currLocationName)
				newCurrLocation = i;
			
			let idxOldLocation = this.state.persistState.locations.findIndex(loc => loc.name === newLocations[i].name);
			if(idxOldLocation >= 0)
				newLocations[i].weather = this.state.persistState.locations[idxOldLocation].weather;
		}

		// Update the state with the new locations array and currently selected location...

		let newPersistState = update(
			this.state.persistState,
			{ locations: { $set: newLocations }, currLocation: { $set: newCurrLocation } });

		await this.setPersistState(newPersistState);

		// We need to tear down and rebuild the Swipe component when we mess with the array of locations.
		// Note that since we await-ed setPersistState, the new content is already rendered at this point
		// and Swipe can work its magic.
		this.m_swipe!.kill();
		this.setupSwipe();

		// If the currently selected location's weather data is stale, refresh it.
		await this.refreshWeatherData(false);
	}

	private setPersistState(
		newPersistState: PersistState)
	{
		// Store the persistent state in local storage. It is persistent for performance
		// reasons, cost reasons (hits to the API cost money), and to support offline use.
		// Basically, any time the page loads, the user should see the same thing they saw
		// last time they used it (until we fetch new weather data, of course).
		window.localStorage.setItem("app_persistState", JSON.stringify(newPersistState));

		// Allow the caller to use await on this.
		return new Promise<void>(resolve => this.setState({ persistState: newPersistState }, resolve));
	}

	private m_swipeElem: React.RefObject<HTMLDivElement>;
	private m_settingsPopup: React.RefObject<SettingsPopup>;
	private m_swipe: Swipe | null;
	private m_unmountCleanup: () => void;
}

export default App;
