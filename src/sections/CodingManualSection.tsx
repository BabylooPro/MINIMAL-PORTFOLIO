import { SectionHeading } from "../components/SectionHeading";

type CodingManualSectionProps = {
	title: string;
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

const previewButtonClassName = [
	"absolute top-1/2 z-0 aspect-square w-[min(52vw,15rem)] -translate-y-1/2 overflow-hidden rounded-lg border border-(--border-color) bg-black p-0",
	"cursor-pointer opacity-70 transition-opacity hover:opacity-100",
	"focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:outline-offset-2",
].join(" ");

const videoClassName = [
	"block aspect-square w-full object-cover",
	"[&:fullscreen]:aspect-auto [&:fullscreen]:object-contain",
	"[&:-webkit-full-screen]:aspect-auto [&:-webkit-full-screen]:object-contain",
].join(" ");

const activeVideoCardClassName =
	"absolute left-1/2 top-1/2 z-10 w-[min(72vw,22rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-(--border-color) bg-black";

function formatVideoCounter(template: string, current: number, total: number): string {
	return template.replace("{current}", String(current)).replace("{total}", String(total));
}

export function CodingManualSection({
	title,
	previousVideoLabel,
	nextVideoLabel,
	videoLabel,
	videoCounterTemplate,
}: CodingManualSectionProps) {
	const activeVideo = videos[0];
	const previousVideo = videos[videos.length - 1];
	const nextVideo = videos[1];

	if (!activeVideo || !previousVideo || !nextVideo) {
		return null;
	}

	return (
		<section
			aria-labelledby="coding-manual-title"
			className="no-print"
			data-coding-manual-carousel
			data-counter-template={videoCounterTemplate}
			data-video-label={videoLabel}
			data-videos={JSON.stringify(videos)}
		>
			<SectionHeading id="coding-manual-title">{title}</SectionHeading>

			<div className="mt-4">
				<div className="relative mx-auto h-[min(72vw,22rem)] w-full max-w-2xl">
					<button
						aria-label={previousVideoLabel}
						className={`${previewButtonClassName} left-0`}
						data-coding-manual-direction="previous"
						type="button"
					>
						<img
							alt=""
							className="size-full object-cover grayscale"
							data-coding-manual-preview="previous"
							loading="lazy"
							src={previousVideo.preview}
							style={{ objectPosition: previousVideo.squareObjectPosition }}
						/>
					</button>

					<div className={activeVideoCardClassName} data-coding-manual-active-card>
						<video
							aria-label={`${videoLabel} 1`}
							className={videoClassName}
							controls
							data-coding-manual-player
							muted
							playsInline
							poster={activeVideo.preview}
							preload="metadata"
							style={{ objectPosition: activeVideo.squareObjectPosition }}
						>
							<source src={activeVideo.source} type="video/mp4" />
						</video>
					</div>

					<button
						aria-label={nextVideoLabel}
						className={`${previewButtonClassName} right-0`}
						data-coding-manual-direction="next"
						type="button"
					>
						<img
							alt=""
							className="size-full object-cover grayscale"
							data-coding-manual-preview="next"
							loading="lazy"
							src={nextVideo.preview}
							style={{ objectPosition: nextVideo.squareObjectPosition }}
						/>
					</button>
				</div>

				<p
					aria-live="polite"
					className="mt-3 text-center text-sm text-(--muted-color)"
					data-coding-manual-counter
				>
					{formatVideoCounter(videoCounterTemplate, 1, videos.length)}
				</p>
			</div>
		</section>
	);
}
