type SectionHeadingProps = {
	id: string;
	children: string;
};

export function SectionHeading({ id, children }: SectionHeadingProps) {
	return (
		<h2 id={id} className="text-sm font-medium uppercase tracking-wider text-neutral-500">
			{children}
		</h2>
	);
}
