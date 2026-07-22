import { SectionHeading } from "../components/ui/SectionHeading";

type ProfileSectionProps = {
	title: string;
	summary: string;
};

export function ProfileSection({ summary, title }: ProfileSectionProps) {
	const paragraphOccurrences = new Map<string, number>();
	const paragraphs = summary.split("\n").map((content) => {
		const occurrence = paragraphOccurrences.get(content) ?? 0;
		paragraphOccurrences.set(content, occurrence + 1);
		return { content, id: `${content}-${occurrence}` };
	});

	return (
		<section aria-labelledby="profile-title">
			<SectionHeading id="profile-title">{title}</SectionHeading>
			{paragraphs.map((paragraph) => (
				<p key={paragraph.id} className="leading-6 first:mt-2">
					{paragraph.content}
				</p>
			))}
		</section>
	);
}
