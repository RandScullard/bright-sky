// Since none of the public APIs called by this app allow cross-origin resource sharing (CORS),
// you will get CORS errors from the browser if you try to directly call these APIs. You must
// set up a proxy for each API that (1) specifies your API key and (2) sets CORS response headers.
// You can easily set up a proxy using AWS API Gateway, for example.

const config = {
	// The URL of the Dark Sky Forecast service:
	forecastUrl: "https://api.darksky.net/forecast",

	// The URL of the Google Maps Place Autocomplete service:
	placeAutocompleteUrl: "https://maps.googleapis.com/maps/api/place/autocomplete/json",

	// The URL of the Google Maps Place Details service:
	placeDetailsUrl: "https://maps.googleapis.com/maps/api/place/details/json"
};

export default config;