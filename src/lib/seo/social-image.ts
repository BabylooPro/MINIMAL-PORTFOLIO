import { rootUrl } from "@/lib/i18n/config";

const defaultSocialImageUrl = new URL("/og-image.jpg", rootUrl).href;
const configuredSocialImageUrl = import.meta.env.VITE_SOCIAL_IMAGE_URL ?? defaultSocialImageUrl;
const socialImageUrl = new URL(configuredSocialImageUrl);

if (socialImageUrl.protocol !== "https:") throw new Error("VITE_SOCIAL_IMAGE_URL must use HTTPS.");

export const socialImage = { url: socialImageUrl.href, type: "image/jpeg", width: 1200, height: 630 } as const;
