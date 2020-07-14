import React from "react";
import ReactDOM from "react-dom";
import WebFont from "webfontloader";
import "./fonts/Roboto.css";
import "./index.scss";
import App from "./app";
import * as serviceWorker from "./serviceWorker";

// Delay rendering the app until the web fonts have either loaded or failed to load.
// This avoids the Flash of Unstyled Text (FOUT) and prevents our React components from
// using the wrong font metrics when calculating the size of elements.
let render = () => ReactDOM.render(<App />, document.getElementById("root"));

WebFont.load({
	custom: {
		families: ["Roboto"]
	},
	active: render,
	inactive: render,
});

serviceWorker.register();
