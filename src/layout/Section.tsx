import type { ComponentPropsWithoutRef } from "react";

type SectionProps = Omit<ComponentPropsWithoutRef<"section">, "aria-labelledby"> & {
	labelledBy: string;
};

export function Section({ children, labelledBy, ...props }: SectionProps) {
	return (
		<section {...props} aria-labelledby={labelledBy}>
			{children}
		</section>
	);
}

type SectionHeadingProps = {
	id: string;
	children: string;
};

export function SectionHeading({ id, children }: SectionHeadingProps) {
	return (
		<h2 id={id} className="text-sm font-medium uppercase tracking-wider text-(--muted-color)">
			{children}
		</h2>
	);
}
