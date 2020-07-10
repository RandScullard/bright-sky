import React from "react";
import ReactDOM from "react-dom";
import WebFont from "webfontloader";
import "./index.scss";
import App from "./app";
import * as serviceWorker from "./serviceWorker";

WebFont.load({
	google: {
		families: ["Roboto:400"]
	}
});

ReactDOM.render(<App />, document.getElementById("root"));

serviceWorker.register();
