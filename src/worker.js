import { DEFAULT_SITE, sites } from "../sites.config.js";

// Each site's build is served from its own /<slug>/ folder in the assets.
const slugs = new Set(Object.values(sites).map((site) => site.slug));

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Production routes only send /<slug> paths to this Worker, so this only
        // matters for local preview (`npm run preview`), which opens on "/".
        if (url.pathname === "/") {
            url.pathname = `/${sites[DEFAULT_SITE].slug}/`;
            return Response.redirect(url.toString(), 302);
        }

        const slug = url.pathname.split("/")[1];
        if (!slugs.has(slug)) {
            return env.ASSETS.fetch(request);
        }

        // 0. Redirect /<slug> (no trailing slash) to /<slug>/
        if (url.pathname === `/${slug}`) {
            url.pathname = `/${slug}/`;
            return Response.redirect(url.toString(), 301);
        }

        // 1. Attempt to fetch the requested asset
        const response = await env.ASSETS.fetch(request);

        // 2. Handle 404s
        if (response.status === 404) {
            // Check if the URL path ends with a file extension (e.g., .css, .js, .png)
            const hasFileExtension = url.pathname.match(/\.[a-z0-9]+$/i);

            if (hasFileExtension) {
                // It's a missing static asset. Return the actual 404 response.
                return response;
            }

            // It's a navigation route (no extension). Fallback to that site's SPA root.
            url.pathname = `/${slug}/`;
            return env.ASSETS.fetch(new Request(url, request));
        }

        // 3. Return the successfully found asset
        return response;
    },
};
