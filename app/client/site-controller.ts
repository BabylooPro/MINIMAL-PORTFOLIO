import { initializePopoverController } from "@/src/components/utils/behavior/popover-controller";
import { initializeScrollStateController } from "@/src/components/utils/behavior/scroll-state-controller";
import { initializeTooltipController } from "@/src/components/utils/behavior/tooltip-controller";
import { initializeMobileRoleRotator } from "@/src/features/landing/utils/mobile-role-rotator";
import { initializeProofWorkController } from "@/src/features/landing/utils/proof-work-controller";
import { initializeThemeController } from "@/src/features/themes/theme-controller";

for (const initialize of [
	initializeThemeController,
	initializeProofWorkController,
	initializeMobileRoleRotator,
	initializeScrollStateController,
	initializeTooltipController,
	initializePopoverController,
]) {
	try {
		initialize();
	} catch (error) {
		console.error(error);
	}
}
