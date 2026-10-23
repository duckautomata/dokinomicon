import { resolveSite } from "../sites.config.js";

/** The site this build is for. Set with VITE_SITE at build time (see vite.config.js). */
export const site = resolveSite(import.meta.env.VITE_SITE);
