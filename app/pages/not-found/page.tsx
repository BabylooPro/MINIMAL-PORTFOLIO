import RootLayout from "@/app/layout";
import { getLocalePath, type Locale } from "@/src/lib/i18n/config";

import type { Dictionary } from "@/src/lib/i18n/dictionaries";

type NotFoundPageProps = { dictionary: Dictionary; locale: Locale };

export function NotFoundPage({ dictionary, locale }: Readonly<NotFoundPageProps>) {
	const { messages } = dictionary;

	return (
		<RootLayout dictionary={dictionary} locale={locale} usePageHeading={false}>
			<main className="mt-6 flex min-h-[calc(100dvh-28rem)] items-center justify-center sm:mt-0">
				<section aria-labelledby="not-found-title">
					<p className="text-sm font-medium tracking-[0.2em] text-(--muted-color)">
						404
					</p>

					<h1 className="mt-3 text-3xl font-semibold tracking-tight text-(--foreground-color)" id="not-found-title">
						{messages.notFound.title}
					</h1>

					<p className="mt-3 max-w-prose text-(--muted-color)">
						{messages.notFound.description}
					</p>

					<a
						className={[
							// BASE
							"mt-6 inline-flex rounded-md px-4 py-2 border border-(--border-color) bg-(--background-color)",
							// TYPOGRAPHY
							"text-sm font-medium text-(--foreground-color)",
							// EFFECTS
							"transition-[background-color,color,transform] hover:bg-(--foreground-color) hover:text-(--background-color) active:translate-y-px",
							// FOCUS
							"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
						].join(" ")}
						href={getLocalePath(locale)}
					>
						{messages.labels.backToPortfolio}
					</a>
				</section>
			</main>
		</RootLayout>
	);
}
