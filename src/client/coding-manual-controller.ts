type VideoDefinition = {
	source: string;
	preview: string;
	squareObjectPosition: string;
};

function isVideoDefinition(value: unknown): value is VideoDefinition {
	if (!value || typeof value !== "object") {
		return false;
	}

	const { preview, source, squareObjectPosition } = value as Record<string, unknown>;

	return (
		typeof preview === "string" &&
		typeof source === "string" &&
		typeof squareObjectPosition === "string"
	);
}

function parseVideos(serializedVideos: string | undefined): VideoDefinition[] {
	if (!serializedVideos) {
		return [];
	}

	try {
		const parsedVideos: unknown = JSON.parse(serializedVideos);

		return Array.isArray(parsedVideos) && parsedVideos.every(isVideoDefinition)
			? parsedVideos
			: [];
	} catch {
		return [];
	}
}

function formatCounter(template: string, current: number, total: number): string {
	return template.replace("{current}", String(current)).replace("{total}", String(total));
}

function initializeCarousel(carousel: HTMLElement): void {
	if (carousel.dataset.codingManualInitialized === "true") {
		return;
	}

	const videos = parseVideos(carousel.dataset.videos);
	const counterTemplate = carousel.dataset.counterTemplate;
	const videoLabel = carousel.dataset.videoLabel;
	const previousButton = carousel.querySelector<HTMLButtonElement>(
		'[data-coding-manual-direction="previous"]',
	);
	const nextButton = carousel.querySelector<HTMLButtonElement>(
		'[data-coding-manual-direction="next"]',
	);
	const previousPreview = carousel.querySelector<HTMLImageElement>(
		'[data-coding-manual-preview="previous"]',
	);
	const nextPreview = carousel.querySelector<HTMLImageElement>(
		'[data-coding-manual-preview="next"]',
	);
	const player = carousel.querySelector<HTMLVideoElement>("[data-coding-manual-player]");
	const source = player?.querySelector<HTMLSourceElement>("source");
	const counter = carousel.querySelector<HTMLElement>("[data-coding-manual-counter]");

	if (
		videos.length === 0 ||
		!counterTemplate ||
		!videoLabel ||
		!previousButton ||
		!nextButton ||
		!previousPreview ||
		!nextPreview ||
		!player ||
		!source ||
		!counter
	) {
		return;
	}

	carousel.dataset.codingManualInitialized = "true";

	const videoPlayer = player;
	const videoSource = source;
	const previousPreviewImage = previousPreview;
	const nextPreviewImage = nextPreview;
	const counterElement = counter;
	const previousControl = previousButton;
	const nextControl = nextButton;
	const counterTextTemplate = counterTemplate;
	const playerLabel = videoLabel;

	let activeIndex = 0;
	let isPlayerVisible = false;
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

	function videoAt(index: number): VideoDefinition {
		const video = videos[(index + videos.length) % videos.length];

		if (!video) {
			throw new Error("Coding Manual carousel requires at least one video.");
		}

		return video;
	}

	function setPreview(preview: HTMLImageElement, video: VideoDefinition): void {
		preview.src = video.preview;
		preview.style.objectPosition = video.squareObjectPosition;
	}

	function syncPlayback(): void {
		if (!isPlayerVisible || document.hidden || reducedMotion.matches) {
			videoPlayer.muted = true;
			videoPlayer.pause();
			return;
		}

		void videoPlayer.play().catch(() => undefined);
	}

	function renderActiveVideo(shouldReload = true): void {
		const activeVideo = videoAt(activeIndex);

		videoPlayer.pause();
		videoPlayer.muted = true;
		videoPlayer.setAttribute("aria-label", `${playerLabel} ${activeIndex + 1}`);
		videoPlayer.style.objectPosition = activeVideo.squareObjectPosition;
		videoPlayer.poster = activeVideo.preview;

		if (shouldReload) {
			videoSource.src = activeVideo.source;
			videoPlayer.load();
		}

		setPreview(previousPreviewImage, videoAt(activeIndex - 1));
		setPreview(nextPreviewImage, videoAt(activeIndex + 1));
		counterElement.textContent = formatCounter(
			counterTextTemplate,
			activeIndex + 1,
			videos.length,
		);

		syncPlayback();
	}

	function switchVideo(offset: number): void {
		activeIndex = (activeIndex + offset + videos.length) % videos.length;
		renderActiveVideo(true);
	}

	function handleDocumentVisibility(): void {
		syncPlayback();
	}

	function handleReducedMotionChange(): void {
		syncPlayback();
	}

	const observer = new IntersectionObserver(
		([entry]) => {
			isPlayerVisible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.5);
			syncPlayback();
		},
		{ threshold: 0.5 },
	);

	previousControl.addEventListener("click", () => switchVideo(-1));
	nextControl.addEventListener("click", () => switchVideo(1));
	videoPlayer.addEventListener("ended", () => {
		if (isPlayerVisible && !document.hidden) {
			switchVideo(1);
		}
	});

	const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");

	function enableHoverSound(): void {
		videoPlayer.muted = false;
		videoPlayer.volume = 1;

		if (!reducedMotion.matches) {
			void videoPlayer.play().catch(() => {
				videoPlayer.muted = true;
			});
		}
	}

	function disableHoverSound(): void {
		videoPlayer.muted = true;
	}

	if (supportsHover.matches) {
		videoPlayer.addEventListener("mouseenter", enableHoverSound);
		videoPlayer.addEventListener("mouseleave", disableHoverSound);
	}

	document.addEventListener("visibilitychange", handleDocumentVisibility);
	reducedMotion.addEventListener("change", handleReducedMotionChange);
	observer.observe(videoPlayer);
	renderActiveVideo(false);
}

for (const carousel of document.querySelectorAll<HTMLElement>("[data-coding-manual-carousel]")) {
	initializeCarousel(carousel);
}
