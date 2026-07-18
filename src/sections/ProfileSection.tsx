import { SectionHeading } from "../components/SectionHeading";

type ProfileSectionProps = {
	profile: string;
};

export function ProfileSection({ profile }: ProfileSectionProps) {
	const paragraphs = profile.split("\n");

	return (
		<section aria-labelledby="profile-title">
			<SectionHeading id="profile-title">Profile</SectionHeading>
			{paragraphs.map((paragraph, index) => (
				<p key={paragraph} className={index === 0 ? "mt-2 leading-6" : "mt-0 leading-6"}>
					{paragraph}
				</p>
			))}
		</section>
	);
}
