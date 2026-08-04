import { initializeScrollStateController } from "@/components/utils/behavior/scroll-state-controller";
import { initializeTooltipController } from "@/components/utils/behavior/tooltip-controller";
import { initializeMobileRoleRotator } from "@/features/landing/utils/mobile-role-rotator";
import { initializeProofWorkController } from "@/features/landing/utils/proof-work-controller";
import { initializeThemeController } from "@/features/themes/theme-controller";

initializeThemeController();
initializeProofWorkController();
initializeMobileRoleRotator();
initializeScrollStateController();
initializeTooltipController();
