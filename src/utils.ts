import React from "react";
import ReactDOMServer from "react-dom/server";

export function degreesToCompass(
	degrees: number)
{
	const compass = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
	let val = Math.round(degrees / 22.5);
	return compass[(val % 16)];
}

export function inlineSvg(
	svgElement: React.ReactElement)
{
	return "url('data:image/svg+xml;base64," + window.btoa(ReactDOMServer.renderToStaticMarkup(svgElement)) + "')";
}

export function isDarkMode()
{
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function listenForDarkModeChange(
	handler: () => void)
{
	let mql = window.matchMedia("(prefers-color-scheme: dark)");
	if(mql.addEventListener != null)
	{
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}
	else
	{
		mql.addListener(handler);
		return () => mql.removeListener(handler);
	}
}

