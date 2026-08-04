import { portfolioDe } from "@/src/features/landing/data/portfolio/de";
import { portfolioEn } from "@/src/features/landing/data/portfolio/en";
import { portfolioFr } from "@/src/features/landing/data/portfolio/fr";

import type { Locale } from "@/src/lib/i18n/config";

import { deMessages } from "@/src/lib/i18n/messages/de";
import { enMessages } from "@/src/lib/i18n/messages/en";
import { frMessages } from "@/src/lib/i18n/messages/fr";

export const dictionaries = {
	en: { messages: enMessages, portfolio: portfolioEn },
	fr: { messages: frMessages, portfolio: portfolioFr },
	de: { messages: deMessages, portfolio: portfolioDe },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
	return dictionaries[locale];
}
