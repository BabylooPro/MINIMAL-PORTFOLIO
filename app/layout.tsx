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

export default function RootLayout({ children, dictionary, locale, page, usePageHeading = page === undefined }: RootLayoutProps) {
	const { messages, portfolio } = dictionary;

	return (
		<div className="overflow-x-clip">
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
