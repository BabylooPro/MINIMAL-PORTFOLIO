type FooterSectionProps = {
	company: string;
};

export function FooterSection({ company }: FooterSectionProps) {
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-(--border-color) py-6 text-sm text-(--muted-color)">
			<p>
				© {year} {company}
			</p>
		</footer>
	);
}
