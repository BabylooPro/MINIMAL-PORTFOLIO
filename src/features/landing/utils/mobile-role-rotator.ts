export function initializeMobileRoleRotator(): void {
	const mobileViewport = matchMedia("(max-width: 39.999rem)");
	const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

	const roleRotators = Array.from(document.querySelectorAll<HTMLElement>("[data-mobile-role-rotator]")).flatMap((element) => {
		const roles = Array.from(element.querySelectorAll<HTMLElement>("[data-mobile-role]"));

		if (roles.length < 2) return [];

		let activeIndex = Math.max(roles.findIndex((role) => !role.hidden), 0);
		let timeout: number | undefined;

		function queueRoleChange(): void {
			const fadeDuration = reducedMotion.matches ? 0 : 500;

			timeout = setTimeout(() => {
				element.setAttribute("data-role-fading", "");

				timeout = setTimeout(() => {
					roles[activeIndex]?.setAttribute("hidden", "");
					activeIndex = (activeIndex + 1) % roles.length;
					roles[activeIndex]?.removeAttribute("hidden");
					element.removeAttribute("data-role-fading");
					queueRoleChange();
				}, fadeDuration);
			}, 5000 - fadeDuration);
		}

		return [() => {
			clearTimeout(timeout);
			timeout = undefined;

			element.removeAttribute("data-role-fading");

			if (mobileViewport.matches && !document.hidden && !reducedMotion.matches) queueRoleChange();
		}];
	});

	for (const synchronizeRoleRotator of roleRotators) {
		synchronizeRoleRotator();

		mobileViewport.addEventListener("change", synchronizeRoleRotator);
		reducedMotion.addEventListener("change", synchronizeRoleRotator);
		document.addEventListener("visibilitychange", synchronizeRoleRotator);
	}
}
