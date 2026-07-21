import sideProjects from "../generated/side-projects.json";
import type { Portfolio } from "../types/portfolio";
import { dictionaries } from "./dictionaries";
import { isValidPortfolioDate } from "./format";
import { validateSideProjectTranslations } from "./side-projects-validation";

type Scalar = string | number | boolean | null | undefined;

function assertNoEmptyStrings(value: unknown, path: string): void {
	if (typeof value === "string" && value.trim().length === 0) {
		throw new Error(`Empty string in ${path}.`);
	}

	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			assertNoEmptyStrings(item, `${path}[${index}]`);
		});
		return;
	}

	if (value && typeof value === "object") {
		Object.entries(value as Record<string, Scalar | unknown>).forEach(([key, item]) => {
			assertNoEmptyStrings(item, `${path}.${key}`);
		});
	}
}

function assertNoDuplicateIds(ids: readonly string[], description: string): void {
	if (new Set(ids).size !== ids.length) {
		throw new Error(`Duplicate ${description} IDs.`);
	}
}

function assertEqualValues(
	expected: readonly string[],
	actual: readonly string[],
	description: string,
	locale: string,
): void {
	if (
		expected.length !== actual.length ||
		expected.some((value, index) => value !== actual[index])
	) {
		throw new Error(`${description} must match English in ${locale}.`);
	}
}

function assertEqualDateData(expected: Portfolio, actual: Portfolio, locale: string): void {
	const hasMatchingDates = expected.experiences.every((experience, index) => {
		const translatedExperience = actual.experiences[index];

		return (
			translatedExperience !== undefined &&
			experience.startDate === translatedExperience.startDate &&
			experience.endDate === translatedExperience.endDate &&
			experience.datePrecision === translatedExperience.datePrecision
		);
	});

	if (!hasMatchingDates) {
		throw new Error(`Experience dates must match English in ${locale}.`);
	}
}

function assertEqualTechnologies(expected: Portfolio, actual: Portfolio, locale: string): void {
	const expectedSkills = expected.skillGroups.flatMap((skillGroup) => skillGroup.skills);
	const actualSkills = actual.skillGroups.flatMap((skillGroup) => skillGroup.skills);

	assertEqualValues(expectedSkills, actualSkills, "Technologies", locale);
}

function validatePortfolio(locale: string, portfolio: Portfolio): void {
	assertNoEmptyStrings(portfolio, `portfolio.${locale}`);
	assertNoDuplicateIds(
		portfolio.experiences.map((experience) => experience.id),
		`experience for ${locale}`,
	);
	assertNoDuplicateIds(
		portfolio.skillGroups.map((skillGroup) => skillGroup.id),
		`skill group for ${locale}`,
	);

	portfolio.experiences.forEach((experience) => {
		if (!isValidPortfolioDate(experience.startDate, experience.datePrecision)) {
			throw new Error(`Invalid start date for ${experience.id} in ${locale}.`);
		}

		if (
			experience.endDate !== null &&
			!isValidPortfolioDate(experience.endDate, experience.datePrecision)
		) {
			throw new Error(`Invalid end date for ${experience.id} in ${locale}.`);
		}
	});
}

export function validateDictionaries(): void {
	const englishPortfolio = dictionaries.en.portfolio;
	const englishExperienceIds = englishPortfolio.experiences.map((experience) => experience.id);
	const englishSkillGroupIds = englishPortfolio.skillGroups.map((skillGroup) => skillGroup.id);
	const englishUrls = englishPortfolio.links.map((link) => link.href);

	Object.entries(dictionaries).forEach(([locale, dictionary]) => {
		assertNoEmptyStrings(dictionary.messages, `messages.${locale}`);
		validatePortfolio(locale, dictionary.portfolio);
		assertEqualValues(
			englishExperienceIds,
			dictionary.portfolio.experiences.map((experience) => experience.id),
			"Experience order and IDs",
			locale,
		);
		assertEqualValues(
			englishSkillGroupIds,
			dictionary.portfolio.skillGroups.map((skillGroup) => skillGroup.id),
			"Skill group order and IDs",
			locale,
		);
		assertEqualValues(
			englishUrls,
			dictionary.portfolio.links.map((link) => link.href),
			"Link URLs",
			locale,
		);
		assertEqualDateData(englishPortfolio, dictionary.portfolio, locale);
		assertEqualTechnologies(englishPortfolio, dictionary.portfolio, locale);
	});

	validateSideProjectTranslations(
		sideProjects,
		Object.fromEntries(
			Object.entries(dictionaries).map(([locale, dictionary]) => [
				locale,
				dictionary.messages.sideProjects.projects,
			]),
		),
	);
}
