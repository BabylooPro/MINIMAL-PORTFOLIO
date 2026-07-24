export class SideProjectsError extends Error {
	constructor(message, kind = "permanent") {
		super(message);
		this.kind = kind;
	}
}

export function createTemporaryError(message) {
	return new SideProjectsError(message, "temporary");
}

export function createPermanentError(message) {
	return new SideProjectsError(message, "permanent");
}
