import { isDesktopPointer } from "@/src/components/utils/behavior/pointer-mode";

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
		let playbackRequest = 0;
		let transitionSource: string | null = null;
		let programmaticPause = false;
		let pendingLoad = false;
		let userPaused = false;

		const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

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
			transitionSource = new URL(video.source, document.baseURI).href;
		}

		function isCurrentTransition(): boolean {
			return transitionSource !== null && transitionSource === videoPlayer.currentSrc;
		}

		function hideTransitionPreview(): void {
			if (!isCurrentTransition()) return;

			transitionPreviewImage.hidden = true;
			transitionLoaderElement.hidden = true;
			delete videoPlayer.dataset.loading;
			transitionSource = null;
		}

		function hideTransitionLoader(): void {
			if (!isCurrentTransition()) return;
			transitionLoaderElement.hidden = true;
		}

		function shouldPlay(): boolean {
			if (!isPlayerVisible || document.hidden || reducedMotion.matches || userPaused) return false;
			return isDesktopPointer() || videoPlayer.controls;
		}

		function stopPlayback(): void {
			playbackRequest += 1;
			programmaticPause = !videoPlayer.paused;
			videoPlayer.pause();
		}

		function syncPlayback(): void {
			if (!shouldPlay()) { stopPlayback(); return; }

			if (pendingLoad) { pendingLoad = false; videoPlayer.load() }
			if (!videoPlayer.paused) return;

			const request = ++playbackRequest;
			if (!videoPlayer.controls) videoPlayer.muted = true;
			void videoPlayer.play().then(() => {
				if (request !== playbackRequest || !shouldPlay()) stopPlayback();
			}, () => undefined);
		}

		function renderActiveVideo(shouldReload = true): void {
			const activeVideo = videoAt(activeIndex);

			stopPlayback();
			videoPlayer.setAttribute("aria-label", `${playerLabel} ${activeIndex + 1}`);
			videoPlayer.poster = activeVideo.preview;

			if (shouldReload) {
				videoSource.src = activeVideo.source;
				pendingLoad = true;
			}

			setPreview(previousPreviewImage, videoAt(activeIndex - 1));
			setPreview(nextPreviewImage, videoAt(activeIndex + 1));
			counterElement.textContent = formatCounter(counterTextTemplate, activeIndex + 1, videos.length);

			syncPlayback();
		}

		function switchVideo(offset: number): void {
			activeIndex = (activeIndex + offset + videos.length) % videos.length;
			userPaused = false;
			if (shouldPlay()) showTransitionPreview(videoAt(activeIndex));
			renderActiveVideo(true);
		}

		function enablePlayerControls(): void {
			videoPlayer.controls = true;
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

		videoPlayer.addEventListener("pointerenter", enablePlayerControls);
		videoPlayer.addEventListener("pointerdown", enablePlayerControls);
		videoPlayer.addEventListener("focus", enablePlayerControls);
		videoPlayer.addEventListener("pause", () => { if (programmaticPause) programmaticPause = false; else userPaused = !videoPlayer.ended });
		videoPlayer.addEventListener("loadeddata", () => { hideTransitionLoader(); if (!shouldPlay()) hideTransitionPreview() });
		videoPlayer.addEventListener("playing", hideTransitionPreview);
		videoSource?.addEventListener("error", hideTransitionLoader);

		document.addEventListener("visibilitychange", syncPlayback);
		reducedMotion.addEventListener("change", syncPlayback);
		observer.observe(videoPlayer);
		renderActiveVideo(false);
	}

	for (const carousel of document.querySelectorAll<HTMLElement>("[data-proof-work-carousel]")) {
		initializeCarousel(carousel);
	}
}
