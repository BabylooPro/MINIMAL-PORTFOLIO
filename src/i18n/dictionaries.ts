import { portfolioDe } from "../data/portfolio/de";
import { portfolioEn } from "../data/portfolio/en";
import { portfolioFr } from "../data/portfolio/fr";

import type { Locale } from "./config";

import { deMessages } from "./messages/de";
import { enMessages } from "./messages/en";
import { frMessages } from "./messages/fr";

export const dictionaries = {
	en: { messages: enMessages, portfolio: portfolioEn },
	fr: { messages: frMessages, portfolio: portfolioFr },
	de: { messages: deMessages, portfolio: portfolioDe },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
	return dictionaries[locale];
}
