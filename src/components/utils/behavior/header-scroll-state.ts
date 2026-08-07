export function interpolate(from: number, to: number, progress: number): number {
	return from + (to - from) * progress;
}

export function progressBetween(value: number, start: number, end: number): number {
	return Math.min(Math.max((value - start) / (end - start), 0), 1);
}

export function isDocumentAtBottom(): boolean {
	return scrollY + innerHeight >= document.documentElement.scrollHeight - 1;
}
