export class SideProjectsError extends Error {
	kind: "permanent" | "temporary";

	constructor(message: string, kind: "permanent" | "temporary" = "permanent") {
		super(message);
		this.kind = kind;
	}
}

export function createTemporaryError(message: string) {
	return new SideProjectsError(message, "temporary");
}

export function createPermanentError(message: string) {
	return new SideProjectsError(message, "permanent");
}
