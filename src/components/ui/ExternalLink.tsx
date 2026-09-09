import type { ReactNode } from "react";

type ExternalLinkProps = {
	children: ReactNode;
	className: string;
	href: string;
};

export function ExternalLink({ children, className, href }: Readonly<ExternalLinkProps>) {
	return (
		<a className={`${className} hover:text-(--foreground-color)`} href={href} rel="noopener noreferrer" target="_blank">
			{children} <span aria-hidden="true">&nbsp;{"\u2197"}</span>
		</a>
	);
}
