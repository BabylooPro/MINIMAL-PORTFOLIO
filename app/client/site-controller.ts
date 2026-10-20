import { initializePopoverController } from "@/src/components/utils/behavior/popover-controller";
import { initializeScrollStateController } from "@/src/components/utils/behavior/scroll-state-controller";
import { initializeTooltipController } from "@/src/components/utils/behavior/tooltip-controller";
import { initializeProofWorkController } from "@/src/features/landing/utils/proof-work-controller";
import { initializeThemeController } from "@/src/features/themes/theme-controller";

for (const initialize of [
	initializeThemeController,
	initializeProofWorkController,
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
