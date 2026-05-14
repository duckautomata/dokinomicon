export default {
    async fetch(request, env) {
        // 0. Redirect /dokinomicon (no trailing slash) to /dokinomicon/
        const url = new URL(request.url);
        if (url.pathname === "/dokinomicon") {
            url.pathname = "/dokinomicon/";
            return Response.redirect(url.toString(), 301);
        }

        // 1. Attempt to fetch the requested asset
        let response = await env.ASSETS.fetch(request);

        // 2. Handle 404s with SPA fallback
        if (response.status === 404) {
            // Check if the URL path ends with a file extension (e.g., .css, .js, .png)
            const hasFileExtension = url.pathname.match(/\.[a-z0-9]+$/i);

            if (hasFileExtension) {
                // It's a missing static asset. Return the actual 404 response.
                return response;
            }

            // It's a navigation route (no extension). Fallback to the SPA's root.
            const fallbackUrl = new URL(url);
            fallbackUrl.pathname = "/dokinomicon/";
            response = await env.ASSETS.fetch(new Request(fallbackUrl, request));
        }

        // 3. Prevent transient edge failures from poisoning the browser's
        //    prefetch cache. Chrome speculatively prefetches links the user
        //    might click; if any of those prefetches hits a 5xx (CF edge cold
        //    start, brief origin blip, etc.), the browser will reuse the
        //    cached failure on the actual click. Marking the response
        //    `no-store` evicts it so the click gets a fresh response.
        if (response.status >= 500) {
            const out = new Response(response.body, response);
            out.headers.set("Cache-Control", "no-store");
            return out;
        }

        return response;
    },
};
