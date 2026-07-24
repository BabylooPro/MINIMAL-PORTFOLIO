type VideoDefinition = {
	source: string;
	preview: string;
	squareObjectPosition: string;
};

export function initializeProofWorkController(): void {
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
		if (carousel.dataset.proofWorkInitialized === "true") {
			return;
		}

		const videos = parseVideos(carousel.dataset.videos);
		const counterTemplate = carousel.dataset.counterTemplate;
		const videoLabel = carousel.dataset.videoLabel;
		const previousButton = carousel.querySelector<HTMLButtonElement>(
			'[data-proof-work-direction="previous"]',
		);
		const nextButton = carousel.querySelector<HTMLButtonElement>(
			'[data-proof-work-direction="next"]',
		);
		const previousPreview = carousel.querySelector<HTMLImageElement>(
			'[data-proof-work-preview="previous"]',
		);
		const nextPreview = carousel.querySelector<HTMLImageElement>(
			'[data-proof-work-preview="next"]',
		);
		const player = carousel.querySelector<HTMLVideoElement>("[data-proof-work-player]");
		const source = player?.querySelector<HTMLSourceElement>("source");
		const counter = carousel.querySelector<HTMLElement>("[data-proof-work-counter]");

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

		carousel.dataset.proofWorkInitialized = "true";

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
		let playbackRequest = 0;

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

		function videoAt(index: number): VideoDefinition {
			const video = videos[(index + videos.length) % videos.length];

			if (!video) {
				throw new Error("Proof Work carousel requires at least one video.");
			}

			return video;
		}

		function setPreview(preview: HTMLImageElement, video: VideoDefinition): void {
			preview.src = video.preview;
			preview.style.objectPosition = video.squareObjectPosition;
		}

		function shouldPlay(): boolean {
			return isPlayerVisible && !document.hidden && !reducedMotion.matches;
		}

		function stopPlayback(): void {
			playbackRequest += 1;
			videoPlayer.muted = true;
			videoPlayer.pause();
		}

		function syncPlayback(): void {
			if (!shouldPlay()) {
				stopPlayback();
				return;
			}

			if (!videoPlayer.paused) {
				return;
			}

			const request = ++playbackRequest;

			videoPlayer.muted = true;
			void videoPlayer.play().then(
				() => {
					if (request !== playbackRequest || !shouldPlay()) {
						stopPlayback();
					}
				},
				() => undefined,
			);
		}

		function renderActiveVideo(shouldReload = true): void {
			const activeVideo = videoAt(activeIndex);

			stopPlayback();
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

		document.addEventListener("visibilitychange", handleDocumentVisibility);
		reducedMotion.addEventListener("change", handleReducedMotionChange);
		observer.observe(videoPlayer);
		renderActiveVideo(false);
	}

	for (const carousel of document.querySelectorAll<HTMLElement>("[data-proof-work-carousel]")) {
		initializeCarousel(carousel);
	}
}
