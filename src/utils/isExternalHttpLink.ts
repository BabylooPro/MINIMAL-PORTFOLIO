export function isExternalHttpLink(href: string) {
	return href.startsWith("https://") || href.startsWith("http://");
}
