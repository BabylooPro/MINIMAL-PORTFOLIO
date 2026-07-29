export const headerScrollConfig = {
	collapseDistance: 180,
	compactHeaderPadding: 16,
	headerIdentityCollapseStart: 0.65,
	mobileCollapseThreshold: 24,
} as const;

export type HeaderPadding = {
	bottom: number;
	top: number;
};

export function interpolate(from: number, to: number, progress: number): number {
	return from + (to - from) * progress;
}

export function progressBetween(value: number, start: number, end: number): number {
	return Math.min(Math.max((value - start) / (end - start), 0), 1);
}

export function getDesktopScrollProgress(scrollY: number): number {
	return Math.min(scrollY / headerScrollConfig.collapseDistance, 1);
}

export function getDesktopHeaderPadding(
	initialPadding: HeaderPadding,
	progress: number,
): HeaderPadding {
	const { compactHeaderPadding } = headerScrollConfig;

	return {
		bottom:
			progress === 1
				? compactHeaderPadding
				: interpolate(initialPadding.bottom, compactHeaderPadding, progress),
		top: interpolate(initialPadding.top, compactHeaderPadding, progress),
	};
}

export function getHeaderIdentityProgress(progress: number) {
	const identityProgress = progressBetween(
		progress,
		headerScrollConfig.headerIdentityCollapseStart,
		1,
	);
	const compactIdentityStart = 0.3;

	return {
		compactIdentityProgress: progressBetween(identityProgress, compactIdentityStart, 1),
		isCompactIdentity: identityProgress >= compactIdentityStart,
	};
}

export function isAtPageBottom({
	scrollY,
	viewportHeight,
	documentHeight,
}: {
	documentHeight: number;
	scrollY: number;
	viewportHeight: number;
}): boolean {
	return scrollY + viewportHeight >= documentHeight - 1;
}

export function isMobileDetailsCollapsed(scrollY: number): boolean {
	return scrollY > headerScrollConfig.mobileCollapseThreshold;
}
