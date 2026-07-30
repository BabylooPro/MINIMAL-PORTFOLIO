export const mediaOrigin = "https://media.maxremy.dev";

export function getMediaUrl(pathname: `/${string}`): string {
	return `${mediaOrigin}${pathname}`;
}
