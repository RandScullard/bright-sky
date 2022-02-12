import ReactDOM from "react-dom";
import "./index.scss";
import App from "./app";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

ReactDOM.render(<App />, document.getElementById("root"));

serviceWorkerRegistration.register();
