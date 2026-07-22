import type { ReactNode } from "react";
import type { ExternalLink } from "../types/portfolio";

function opensInNewTab(href: string) {
	return href.startsWith("https://") || href.startsWith("http://");
}

export function renderTextWithPortfolioLinks(
	text: string,
	links: readonly ExternalLink[],
): ReactNode[] {
	const content: ReactNode[] = [];
	let remainingText = text;
	let key = 0;

	while (remainingText.length > 0) {
		const nextLink = links
			.map((link) => ({ index: remainingText.indexOf(link.label), link }))
			.filter((match) => match.index >= 0)
			.sort(
				(first, second) =>
					first.index - second.index ||
					second.link.label.length - first.link.label.length,
			)[0];

		if (!nextLink) {
			content.push(remainingText);
			break;
		}

		if (nextLink.index > 0) {
			content.push(remainingText.slice(0, nextLink.index));
		}

		content.push(
			<a
				className="font-medium text-(--foreground-color) underline underline-offset-2"
				href={nextLink.link.href}
				key={`${nextLink.link.href}-${key}`}
				rel={opensInNewTab(nextLink.link.href) ? "noopener noreferrer" : undefined}
				target={opensInNewTab(nextLink.link.href) ? "_blank" : undefined}
			>
				{nextLink.link.label}
			</a>,
		);

		remainingText = remainingText.slice(nextLink.index + nextLink.link.label.length);
		key += 1;
	}

	return content;
}
