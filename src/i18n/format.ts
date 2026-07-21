import type { DatePrecision } from "../types/portfolio";
import type { Locale } from "./config.ts";
import { localeConfigs } from "./config.ts";

function parsePortfolioDate(value: string): Date {
	if (/^\d{4}$/.test(value)) {
		return new Date(`${value}-01-01T00:00:00Z`);
	}

	if (/^\d{4}-\d{2}$/.test(value)) {
		const month = Number(value.slice(5));

		if (month >= 1 && month <= 12) {
			return new Date(`${value}-01T00:00:00Z`);
		}
	}

	throw new Error(`Invalid portfolio date: ${value}`);
}

function capitalizeFrenchDate(value: string): string {
	return value.replace(/^./u, (firstCharacter) => firstCharacter.toLocaleUpperCase("fr-CH"));
}

export function formatPortfolioDate(
	locale: Locale,
	value: string,
	precision: DatePrecision,
): string {
	const formatter = new Intl.DateTimeFormat(
		localeConfigs[locale].intlLocale,
		precision === "year"
			? { year: "numeric", timeZone: "UTC" }
			: { month: "short", year: "numeric", timeZone: "UTC" },
	);

	const formattedDate = formatter.format(parsePortfolioDate(value));

	return locale === "fr" ? capitalizeFrenchDate(formattedDate) : formattedDate;
}

export function formatSideProjectDate(locale: Locale, value: string): string {
	return new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(value));
}

export function isValidPortfolioDate(value: string, precision: DatePrecision): boolean {
	if (precision === "year" && !/^\d{4}$/.test(value)) {
		return false;
	}

	if (precision === "month" && !/^\d{4}-\d{2}$/.test(value)) {
		return false;
	}

	try {
		parsePortfolioDate(value);
		return true;
	} catch {
		return false;
	}
}
