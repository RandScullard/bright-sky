export interface Wind
{
	bearing: number;
	speed: number;
	gust: number;
}

export interface ChartPoint
{
	time: number;
	value: number;
}

export interface DayWeather
{
	time: number;
	conditionsIcon: string;
	highTemperature: number;
	lowTemperature: number;
	precipProb: number;
}

export interface WeatherAlert
{
	title: string;
	regions: string[];
	severity: string;
	time: number;
	expires: number;
	description: string;
	uri: string;
}

export interface Weather
{
	timestamp: number;
	timezone: string;
	currentConditions: string;
	currentConditionsIcon: string;
	currentTemperature: number;
	apparentTemperature: number;
	currentHumidity: number;
	currentWind: Wind;
	todayConditions: string;
	todayHighTemperature: number;
	todayLowTemperature: number;
	todayPrecipType: string;
	todayPrecipProb: number;
	todayPrecipAccum: number;
	todayWind: Wind;
	yesterdayHighTemperature: number;
	alerts: WeatherAlert[];
	dailyChartData: DayWeather[];
	temperatureChartData: ChartPoint[];
	precipChartData: ChartPoint[];
}

export interface Location
{
	name: string;
	latitude: number;
	longitude: number;
	weather: Weather | null;
}
