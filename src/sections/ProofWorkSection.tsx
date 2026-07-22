import { InfoIcon } from "../components/svg/InfoIcon";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Tooltip } from "../components/ui/Tooltip";
import type { ExternalLink } from "../types/portfolio";
import { renderTextWithPortfolioLinks } from "../utils/renderTextWithPortfolioLinks";

type ProofWorkSectionProps = {
	title: string;
	description: string;
	links: readonly ExternalLink[];
	postscript: string;
	tooltipLabel: string;
	previousVideoLabel: string;
	nextVideoLabel: string;
	videoLabel: string;
	videoCounterTemplate: string;
};

const videos = [
	{
		source: "/videos/timelapse/1.mp4",
		preview: "/videos/timelapse/previews/1.jpg",
		squareObjectPosition: "50% 67%",
	},
	{
		source: "/videos/timelapse/2.mp4",
		preview: "/videos/timelapse/previews/2.jpg",
		squareObjectPosition: "50% 72%",
	},
	{
		source: "/videos/timelapse/3.mp4",
		preview: "/videos/timelapse/previews/3.jpg",
		squareObjectPosition: "50% 60%",
	},
	{
		source: "/videos/timelapse/4.mp4",
		preview: "/videos/timelapse/previews/4.jpg",
		squareObjectPosition: "50% 80%",
	},
	{
		source: "/videos/timelapse/5.mp4",
		preview: "/videos/timelapse/previews/5.jpg",
		squareObjectPosition: "50% 7%",
	},
	{
		source: "/videos/timelapse/6.mp4",
		preview: "/videos/timelapse/previews/6.jpg",
		squareObjectPosition: "50% 80%",
	},
] as const;

type Video = (typeof videos)[number];

type VideoPreviewButtonProps = {
	direction: "previous" | "next";
	label: string;
	positionClassName: "left-0" | "right-0";
	video: Video;
};

function VideoPreviewButton({
	direction,
	label,
	positionClassName,
	video,
}: VideoPreviewButtonProps) {
	return (
		<button
			aria-label={label}
			className={[
				// PREVIEW CARD LAYOUT
				"absolute top-1/2 z-0 aspect-square w-[min(52vw,15rem)] -translate-y-1/2 overflow-hidden",
				// PREVIEW CARD SURFACE
				"rounded-lg border border-(--border-color) bg-black p-0",
				// POINTER AND KEYBOARD FEEDBACK
				"cursor-pointer opacity-70 transition-opacity hover:opacity-100",
				"focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
				// POSITION PARAMS CHOOSE
				positionClassName,
			].join(" ")}
			data-proof-work-direction={direction}
			type="button"
		>
			<img
				alt=""
				className="size-full object-cover grayscale"
				data-proof-work-preview={direction}
				loading="lazy"
				src={video.preview}
				style={{ objectPosition: video.squareObjectPosition }}
			/>
		</button>
	);
}

function formatVideoCounter(template: string, current: number, total: number): string {
	return template.replace("{current}", String(current)).replace("{total}", String(total));
}

export function ProofWorkSection({
	title,
	description,
	links,
	postscript,
	tooltipLabel,
	previousVideoLabel,
	nextVideoLabel,
	videoLabel,
	videoCounterTemplate,
}: ProofWorkSectionProps) {
	const activeVideo = videos[0];
	const previousVideo = videos[videos.length - 1];
	const nextVideo = videos[1];

	if (!activeVideo || !previousVideo || !nextVideo) {
		return null;
	}

	return (
		<section
			aria-labelledby="proof-work-title"
			className="no-print"
			data-proof-work-carousel
			data-counter-template={videoCounterTemplate}
			data-video-label={videoLabel}
			data-videos={JSON.stringify(videos)}
		>
			<div className="relative z-30 flex items-center gap-1">
				<SectionHeading id="proof-work-title">{title}</SectionHeading>

				<Tooltip id="proof-work" label={tooltipLabel} trigger={<InfoIcon />}>
					<p className="whitespace-pre-line">
						{renderTextWithPortfolioLinks(description, links)}
					</p>
					<p className="mt-2 text-(--muted-color) italic">{postscript}</p>
				</Tooltip>
			</div>

			<div className="mt-4">
				<div className="relative mx-auto h-[min(72vw,22rem)] w-full max-w-2xl">
					<VideoPreviewButton
						direction="previous"
						label={previousVideoLabel}
						positionClassName="left-0"
						video={previousVideo}
					/>

					<div
						className={[
							// CENTERED ACTIVE CARD
							"absolute left-1/2 top-1/2 z-10 w-[min(72vw,22rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden",
							// CARD SURFACE
							"rounded-lg border border-(--border-color) bg-black",
						].join(" ")}
						data-proof-work-active-card
					>
						<video
							aria-label={`${videoLabel} 1`}
							className={[
								// DEFAULT INLINE PLAYER
								"block aspect-square w-full object-cover",
								// FULLSCREEN PLAYER
								"[&:fullscreen]:aspect-auto [&:fullscreen]:object-contain",
								"[&:-webkit-full-screen]:aspect-auto [&:-webkit-full-screen]:object-contain",
							].join(" ")}
							controls
							data-proof-work-player
							muted
							playsInline
							poster={activeVideo.preview}
							preload="metadata"
							style={{ objectPosition: activeVideo.squareObjectPosition }}
						>
							<source src={activeVideo.source} type="video/mp4" />
						</video>
					</div>

					<VideoPreviewButton
						direction="next"
						label={nextVideoLabel}
						positionClassName="right-0"
						video={nextVideo}
					/>
				</div>

				<p
					aria-live="polite"
					className="mt-3 text-center text-sm text-(--muted-color)"
					data-proof-work-counter
				>
					{formatVideoCounter(videoCounterTemplate, 1, videos.length)}
				</p>
			</div>
		</section>
	);
}
