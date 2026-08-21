export function escapeHtml(value) {
	return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const invalidJpegMessage = "The social image must be a valid JPEG.";

function isStartOfFrameMarker(marker) {
	return (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
}

function readSegmentMarker(source, offset) {
	if (source[offset] !== 0xff) throw new Error(invalidJpegMessage);

	let markerOffset = offset;
	while (source[markerOffset] === 0xff) markerOffset += 1;

	return { marker: source[markerOffset], offset: markerOffset + 1 };
}

function readFrameDimensions(source, offset, segmentLength) {
	if (segmentLength < 8) throw new Error(invalidJpegMessage);
	return { height: source.readUInt16BE(offset + 3), width: source.readUInt16BE(offset + 5) };
}

export function getJpegDimensions(source) {
	if (source.length < 4 || source[0] !== 0xff || source[1] !== 0xd8) throw new Error(invalidJpegMessage);

	let offset = 2;
	while (offset < source.length) {
		const segment = readSegmentMarker(source, offset);
		offset = segment.offset;

		if (segment.marker === undefined || segment.marker === 0xd9 || segment.marker === 0xda) break;
		if (segment.marker === 0x01 || (segment.marker >= 0xd0 && segment.marker <= 0xd7)) continue;
		if (offset + 2 > source.length) break;

		const segmentLength = source.readUInt16BE(offset);
		if (segmentLength < 2 || offset + segmentLength > source.length) throw new Error(invalidJpegMessage);
		if (isStartOfFrameMarker(segment.marker)) return readFrameDimensions(source, offset, segmentLength);

		offset += segmentLength;
	}

	throw new Error("The social image does not contain JPEG dimensions.");
}

function escapeRegularExpression(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

export function getAttribute(element, attribute) {
	const attributePattern = new RegExp(String.raw`\b${escapeRegularExpression(attribute)}=(["'])([\s\S]*?)\1`, "i");
	return element.match(attributePattern)?.[2] ?? null;
}

export function hasAttribute(element, attribute) {
	return new RegExp(String.raw`\b${escapeRegularExpression(attribute)}\b`, "i").test(element);
}

export function getScriptElements(html) {
	return html.match(/<script\b[\s\S]*?<\/script>/gi) ?? [];
}

export function getMetaElements(html, name) {
	return (html.match(/<meta\b[^>]*>/gi) ?? []).filter((element) => getAttribute(element, "name") === name);
}

export function getMetaHttpEquivElements(html, value) {
	return (html.match(/<meta\b[^>]*>/gi) ?? []).filter((element) => getAttribute(element, "http-equiv")?.toLowerCase() === value.toLowerCase());
}

export function getMetaPropertyElements(html, property) {
	return (html.match(/<meta\b[^>]*>/gi) ?? []).filter((element) => getAttribute(element, "property") === property);
}

export function getLinkElements(html, rel) {
	return (html.match(/<link\b[^>]*>/gi) ?? []).filter((element) => getAttribute(element, "rel") === rel);
}

export function getAnchorElements(html) {
	return html.match(/<a\b[^>]*>/gi) ?? [];
}

export function isModuleScript(scriptElement) {
	return getAttribute(scriptElement, "type") === "module";
}

export function isJsonLdScript(scriptElement) {
	return getAttribute(scriptElement, "type") === "application/ld+json";
}
