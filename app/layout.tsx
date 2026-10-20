import type { ReactNode } from "react";

import { Container } from "@/src/components/ui/Container";
import { Header } from "@/src/components/ui/Header";
import { Footer } from "@/src/features/landing/Footer";

import type { LegalPageId, Locale } from "@/src/lib/i18n/config";
import type { Dictionary } from "@/src/lib/i18n/dictionaries";

import "@/app/styles/global.css";

type RootLayoutProps = {
	children: ReactNode;
	dictionary: Dictionary;
	locale: Locale;
	page?: LegalPageId;
	usePageHeading?: boolean;
};

export default function RootLayout({ children, dictionary, locale, page, usePageHeading = page === undefined }: Readonly<RootLayoutProps>) {
	const { messages, portfolio } = dictionary;

	return (
		<div className="overflow-x-clip">
			<a
				className={[
					// HIDDEN UNTIL FOCUSED
					"not-focus:sr-only fixed left-4 top-4 z-50 rounded-md px-4 py-2 border border-(--border-color) bg-(--background-color)",
					// TYPOGRAPHY
					"text-sm font-medium text-(--foreground-color)",
					// FOCUS
					"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
				].join(" ")}
				href="#main"
			>
				{messages.labels.skipToContent}
			</a>

			<Header
				currentLocale={locale}
				labels={messages.labels}
				portfolio={portfolio}
				usePageHeading={usePageHeading}
				{...(page ? { page } : {})}
			/>

			<Container>
				{children}
			</Container>

			<Footer
				company={portfolio.company}
				currentLocale={locale}
				footer={messages.footer}
				theme={messages.theme}
				{...(page ? { currentPage: page } : {})}
			/>
		</div>
	);
}
