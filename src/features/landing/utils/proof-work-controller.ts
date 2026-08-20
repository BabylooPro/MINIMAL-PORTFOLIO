import { isDesktopGesture } from "@/src/components/utils/behavior/pointer-mode";

type VideoDefinition = {
	source: string;
	preview: string;
};

export function initializeProofWorkController(): void {
	function formatCounter(template: string, current: number, total: number): string {
		return template.replace("{current}", String(current)).replace("{total}", String(total));
	}

	function initializeCarousel(carousel: HTMLElement): void {
		let parsedVideos: unknown;
		try {
			parsedVideos = JSON.parse(carousel.dataset.videos ?? "[]");
		} catch {
			return;
		}

		if (!Array.isArray(parsedVideos) || parsedVideos.length === 0) return;

		const videos = parsedVideos as VideoDefinition[];

		const counterTextTemplate = carousel.dataset.counterTemplate as string;
		const playerLabel = carousel.dataset.videoLabel as string;

		const previousControl = carousel.querySelector('[data-proof-work-direction="previous"]') as HTMLButtonElement;
		const nextControl = carousel.querySelector('[data-proof-work-direction="next"]') as HTMLButtonElement;
		const previousPreviewImage = carousel.querySelector('[data-proof-work-preview="previous"]') as HTMLImageElement;
		const nextPreviewImage = carousel.querySelector('[data-proof-work-preview="next"]') as HTMLImageElement;

		const transitionPreviewImage = carousel.querySelector('[data-proof-work-transition-preview]') as HTMLImageElement;
		const transitionLoaderElement = carousel.querySelector('[data-proof-work-transition-loader]') as HTMLElement;

		const videoPlayer = carousel.querySelector("[data-proof-work-player]") as HTMLVideoElement;
		const videoSource = videoPlayer?.querySelector("source") as HTMLSourceElement;
		const counterElement = carousel.querySelector("[data-proof-work-counter]") as HTMLElement;

		let activeIndex = 0;
		let isPlayerVisible = false;
		let transitionSource: string | null = null;
		let controllerPaused = true;

		const forceControls = matchMedia("(prefers-reduced-motion: reduce)").matches;

		function isUserPaused(): boolean {
			return videoPlayer.paused && !controllerPaused;
		}

		function resetPlayerControls(): void {
			if (!forceControls && !isUserPaused()) videoPlayer.controls = false;
		}

		function videoAt(index: number): VideoDefinition {
			return videos[(index + videos.length) % videos.length] as VideoDefinition;
		}

		function setPreview(preview: HTMLImageElement, video: VideoDefinition): void {
			preview.src = video.preview;
		}

		function showTransitionPreview(video: VideoDefinition): void {
			setPreview(transitionPreviewImage, video);
			transitionPreviewImage.hidden = false;
			transitionLoaderElement.hidden = false;
			videoPlayer.dataset.loading = "true";
			transitionSource = video.source;
		}

		function isCurrentTransition(): boolean {
			return transitionSource === videoPlayer.currentSrc;
		}

		function hideTransitionPreview(): void {
			if (!isCurrentTransition()) return;

			transitionPreviewImage.hidden = true;
			transitionLoaderElement.hidden = true;
			delete videoPlayer.dataset.loading;
			transitionSource = null;
		}

		function shouldPlay(): boolean {
			return (
				(isPlayerVisible && !document.hidden) ||
				document.pictureInPictureElement === videoPlayer
			) && !isUserPaused();
		}

		function stopPlayback(): void {
			if (!videoPlayer.paused) controllerPaused = true;
			videoPlayer.pause();
		}

		function syncPlayback(): void {
			if (!shouldPlay()) { stopPlayback(); return; }
			if (!videoPlayer.paused) return;
			if (!videoPlayer.controls) videoPlayer.muted = true;
			controllerPaused = false;

			void videoPlayer.play().then(() => {
				if (!shouldPlay()) stopPlayback();
			}, (error: DOMException) => {
				if (error.name !== "NotAllowedError") return;
				controllerPaused = true;
				if (!videoPlayer.muted) return;
				for (const type of ["pointerdown", "keydown"]) document.addEventListener(type, syncPlayback, { once: true });
			});
		}

		function renderActiveVideo(shouldReload: boolean): void {
			const activeVideo = videoAt(activeIndex);

			videoPlayer.setAttribute("aria-label", `${playerLabel} ${activeIndex + 1}`);
			videoPlayer.poster = activeVideo.preview;

			if (shouldReload) {
				videoSource.src = activeVideo.source;
				videoPlayer.load();
			}

			setPreview(previousPreviewImage, videoAt(activeIndex - 1));
			setPreview(nextPreviewImage, videoAt(activeIndex + 1));
			counterElement.textContent = formatCounter(counterTextTemplate, activeIndex + 1, videos.length);

			syncPlayback();
		}

		function switchVideo(offset: number): void {
			activeIndex = (activeIndex + offset + videos.length) % videos.length;
			controllerPaused = true;
			resetPlayerControls();
			if (shouldPlay()) showTransitionPreview(videoAt(activeIndex));
			renderActiveVideo(true);
		}

		function enablePlayerControls(): void {
			if (!videoPlayer.controls) videoPlayer.controls = true;
		}

		const observer = new IntersectionObserver(([entry]) => {
			isPlayerVisible = (entry?.intersectionRatio ?? 0) >= 0.25;
			if (!isPlayerVisible) resetPlayerControls();
			syncPlayback();
		}, { threshold: 0.25 });

		previousControl.addEventListener("click", () => switchVideo(-1));
		nextControl.addEventListener("click", () => switchVideo(1));

		videoPlayer.addEventListener("pointerenter", () => { if (isDesktopGesture()) enablePlayerControls() });
		videoPlayer.addEventListener("pointerup", enablePlayerControls);
		videoPlayer.addEventListener("focus", enablePlayerControls);

		videoPlayer.addEventListener("playing", hideTransitionPreview);

		videoPlayer.addEventListener("loadeddata", hideTransitionPreview);
		videoSource?.addEventListener("error", hideTransitionPreview);
		videoPlayer.addEventListener("error", hideTransitionPreview);

		document.addEventListener("visibilitychange", syncPlayback);
		observer.observe(videoPlayer);
		if (forceControls) videoPlayer.controls = true;
		renderActiveVideo(false);
	}

	for (const carousel of document.querySelectorAll<HTMLElement>("[data-proof-work-carousel]")) {
		initializeCarousel(carousel);
	}
}
