import { InfoIcon } from "@/components/icons/InfoIcon";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Tooltip } from "@/components/ui/Tooltip";

import type { Messages } from "@/lib/i18n/messages/types";
import { getMediaUrl } from "@/lib/media-origin";
import type { ExternalLink } from "@/types/portfolio";
import { renderTextWithPortfolioLinks } from "@/utils/renderTextWithPortfolioLinks";

type ProofWorkSectionProps = {
	content: Messages["proofWork"];
	title: string;
	links: readonly ExternalLink[];
};

type SquarePosition = `object-[${string}]`;

const videos = [
	{
		source: getMediaUrl("/videos/timelapse/1.mp4"),
		preview: "/videos/timelapse/previews/1.jpg",
		squarePosition: "object-[50%_67%]",
	},
	{
		source: getMediaUrl("/videos/timelapse/2.mp4"),
		preview: "/videos/timelapse/previews/2.jpg",
		squarePosition: "object-[50%_72%]",
	},
	{
		source: getMediaUrl("/videos/timelapse/3.mp4"),
		preview: "/videos/timelapse/previews/3.jpg",
		squarePosition: "object-[50%_60%]",
	},
	{
		source: getMediaUrl("/videos/timelapse/4.mp4"),
		preview: "/videos/timelapse/previews/4.jpg",
		squarePosition: "object-[50%_80%]",
	},
	{
		source: getMediaUrl("/videos/timelapse/5.mp4"),
		preview: "/videos/timelapse/previews/5.jpg",
		squarePosition: "object-[50%_7%]",
	},
	{
		source: getMediaUrl("/videos/timelapse/6.mp4"),
		preview: "/videos/timelapse/previews/6.jpg",
		squarePosition: "object-[50%_80%]",
	},
] as const satisfies readonly {
	source: string;
	preview: string;
	squarePosition: SquarePosition;
}[];

type Video = (typeof videos)[number];

type VideoPreviewButtonProps = {
	direction: "previous" | "next";
	label: string;
	positionClassName: "left-0" | "right-0";
	video: Video;
};

function VideoPreviewButton({ direction, label, positionClassName, video }: VideoPreviewButtonProps) {
	return (
		<button
			aria-label={label}
			className={[
				// PREVIEW CARD LAYOUT
				"absolute top-1/2 z-0 aspect-square w-[min(42vw,12rem)] -translate-y-1/2 overflow-hidden sm:w-[min(52vw,15rem)]",
				// PREVIEW CARD SURFACE
				"rounded-lg border border-(--border-color) bg-black p-0",
				// POINTER AND KEYBOARD FEEDBACK
				"cursor-pointer opacity-70 transition-[opacity,scale] hover:scale-[1.1] hover:opacity-100",
				"focus-visible:scale-[1.1] focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
				// SCALE TOWARD THE ACTIVE CARD
				direction === "previous" ? "origin-left" : "origin-right",
				// POSITION PARAMS CHOOSE
				positionClassName,
			].join(" ")}
			data-proof-work-direction={direction}
			type="button"
		>
			<img
				alt=""
				className={`size-full object-cover grayscale ${video.squarePosition}`}
				data-proof-work-preview={direction}
				loading="lazy"
				src={video.preview}
			/>

			<span
				aria-hidden="true"
				className={[
					"pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-3xl font-bold text-white drop-shadow",
					direction === "previous" ? "left-2" : "right-2"
				].join(" ")}
			>
				{direction === "previous" ? "‹" : "›"}
			</span>
		</button>
	);
}

function formatVideoCounter(template: string, current: number, total: number): string {
	return template.replace("{current}", String(current)).replace("{total}", String(total));
}

export function ProofWorkSection({ content, links, title }: ProofWorkSectionProps) {
	const activeVideo = videos[0];
	const previousVideo = videos[videos.length - 1];
	const nextVideo = videos[1];
	const tooltipHasLink = links.some((link) => content.description.includes(link.label));

	if (!activeVideo || !previousVideo || !nextVideo) return null;

	return (
		<Section
			className="no-print"
			data-proof-work-carousel
			data-counter-template={content.videoCounterTemplate}
			data-video-label={content.video}
			data-videos={JSON.stringify(videos)}
			labelledBy="proof-work-title"
		>
			<div
				className={[
					"relative flex items-center gap-1",
					"after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:border-b after:border-(--muted-color)"
				].join(" ")}
			>
				<SectionHeading id="proof-work-title">
					{title}
				</SectionHeading>

				<Tooltip id="proof-work" interactive={tooltipHasLink} label={content.tooltipLabel} trigger={<InfoIcon />}>
					<p className="whitespace-pre-line">{renderTextWithPortfolioLinks(content.description, links)}</p>
					<p className="mt-2 text-(--muted-color) italic">{content.postscript}</p>
				</Tooltip>
			</div>

			<p className="mt-2 text-sm leading-5">
				{content.summary}
			</p>

			<div className="mt-3">
				<div className="relative mx-auto h-[min(56vw,17rem)] w-full max-w-2xl sm:h-[min(72vw,22rem)]">
					<VideoPreviewButton
						direction="previous"
						label={content.previousVideo}
						positionClassName="left-0"
						video={previousVideo}
					/>

					<div
						className={[
							// CENTERED ACTIVE CARD
							"absolute left-1/2 top-1/2 z-10 w-[min(56vw,17rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden sm:w-[min(72vw,22rem)]",
							// CARD SURFACE
							"rounded-lg border border-(--border-color) bg-black",
						].join(" ")}
						data-proof-work-active-card
					>
						<video
							aria-label={`${content.video} 1`}
							className={[
								// DEFAULT INLINE PLAYER
								`block aspect-square w-full object-cover ${activeVideo.squarePosition}`,
								// FULLSCREEN PLAYER
								"[&:fullscreen]:aspect-auto [&:fullscreen]:object-contain",
								"[&:-webkit-full-screen]:aspect-auto [&:-webkit-full-screen]:object-contain",
							].join(" ")}
							data-proof-work-player
							muted
							playsInline
							poster={activeVideo.preview}
							preload="metadata" // DNC: REQUIRED FOR FAST INITIAL LOAD
							tabIndex={0}
						>
							<source src={activeVideo.source} type="video/mp4" />
						</video>
					</div>

					<VideoPreviewButton
						direction="next"
						label={content.nextVideo}
						positionClassName="right-0"
						video={nextVideo}
					/>
				</div>

				<p aria-live="polite" className="mt-3 text-center text-sm text-(--muted-color)" data-proof-work-counter>
					{formatVideoCounter(content.videoCounterTemplate, 1, videos.length)}
				</p>
			</div>
		</Section>
	);
}
