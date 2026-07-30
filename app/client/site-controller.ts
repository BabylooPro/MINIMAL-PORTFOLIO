import { initializeScrollStateController } from "@/components/utils/behavior/scroll-state-controller";
import { initializeTooltipController } from "@/components/utils/behavior/tooltip-controller";
import { initializeMobileRoleRotator } from "@/features/landing/mobile-role-rotator";
import { initializeProofWorkController } from "@/features/landing/proof-work-controller";
import { initializeThemeController } from "@/features/themes/theme-controller";

initializeThemeController();
initializeProofWorkController();
initializeMobileRoleRotator();
initializeScrollStateController();
initializeTooltipController();
