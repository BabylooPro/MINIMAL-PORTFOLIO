import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";
import { structuredData } from "./data/structured-data";

export function render(): string {
	return renderToStaticMarkup(<App />);
}

export function renderStructuredData(): string {
	return JSON.stringify(structuredData);
}
