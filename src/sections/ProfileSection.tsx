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
			{paragraphs.map((paragraph, index) => (
				<p key={paragraph} className={index === 0 ? "mt-2 leading-6" : "mt-0 leading-6"}>
					{paragraph}
				</p>
			))}
		</section>
	);
}
