import { SectionHeading } from "../components/SectionHeading";

type ProfileSectionProps = {
	title: string;
	summary: string;
};

export function ProfileSection({ summary, title }: ProfileSectionProps) {
	const paragraphs = summary.split("\n");

	return (
		<section aria-labelledby="profile-title">
			<SectionHeading id="profile-title">{title}</SectionHeading>
			{paragraphs.map((paragraph) => (
				<p key={paragraph} className="leading-6 first:mt-2">
					{paragraph}
				</p>
			))}
		</section>
	);
}
