const roleChangeInterval = 5000;
const roleFadeDuration = 500;
const mobileViewport = window.matchMedia("(max-width: 39.999rem)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

type RoleRotator = {
	activeIndex: number;
	element: HTMLElement;
	roles: HTMLElement[];
	timeout: number | undefined;
};

function clearRotation(rotator: RoleRotator): void {
	if (rotator.timeout !== undefined) {
		window.clearTimeout(rotator.timeout);
		rotator.timeout = undefined;
	}

	rotator.element.removeAttribute("data-role-fading");
}

function queueRoleChange(rotator: RoleRotator): void {
	const fadeDuration = reducedMotion.matches ? 0 : roleFadeDuration;

	rotator.timeout = window.setTimeout(() => {
		rotator.element.setAttribute("data-role-fading", "");

		rotator.timeout = window.setTimeout(() => {
			rotator.roles[rotator.activeIndex]?.setAttribute("hidden", "");
			rotator.activeIndex = (rotator.activeIndex + 1) % rotator.roles.length;
			rotator.roles[rotator.activeIndex]?.removeAttribute("hidden");
			rotator.element.removeAttribute("data-role-fading");
			queueRoleChange(rotator);
		}, fadeDuration);
	}, roleChangeInterval - fadeDuration);
}

function synchronizeRoleRotators(rotators: RoleRotator[]): void {
	for (const rotator of rotators) {
		clearRotation(rotator);

		if (mobileViewport.matches && !document.hidden) {
			queueRoleChange(rotator);
		}
	}
}

const roleRotators = Array.from(
	document.querySelectorAll<HTMLElement>("[data-mobile-role-rotator]"),
).flatMap((element) => {
	const roles = Array.from(element.querySelectorAll<HTMLElement>("[data-mobile-role]"));

	if (roles.length < 2) {
		return [];
	}

	return [
		{
			activeIndex: Math.max(
				roles.findIndex((role) => !role.hidden),
				0,
			),
			element,
			roles,
			timeout: undefined,
		},
	];
});

synchronizeRoleRotators(roleRotators);
mobileViewport.addEventListener("change", () => synchronizeRoleRotators(roleRotators));
reducedMotion.addEventListener("change", () => synchronizeRoleRotators(roleRotators));
document.addEventListener("visibilitychange", () => synchronizeRoleRotators(roleRotators));
