import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/features/landing/Footer";
import type { LegalPageId, Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import "@/app/styles/global.css";

type RootLayoutProps = {
	children: ReactNode;
	dictionary: Dictionary;
	locale: Locale;
	page?: LegalPageId;
};

export default function RootLayout({ children, dictionary, locale, page }: RootLayoutProps) {
	const { messages, portfolio } = dictionary;

	return (
		<div className="overflow-x-clip">
			<Header
				currentLocale={locale}
				downloadCvLabel={messages.labels.downloadCv}
				emailLabel={messages.labels.email}
				languageSwitcherLabel={messages.labels.languageSwitcher}
				phoneLabel={messages.labels.phone}
				portfolio={portfolio}
				usePageHeading={page === undefined}
				{...(page ? { page } : {})}
			/>

			<Container>{children}</Container>

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
