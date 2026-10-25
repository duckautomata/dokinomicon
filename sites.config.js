// Every site is built from the same code and served at /<slug>/.
// `slug` is permanent once published: it is the URL path, the CDN/R2 prefix the
// data is read from, the `site` sent with suggestions, and the duck-site card id.
// `id` is the short key used for VITE_SITE, public/<id>/ and data-site.
//
// Read by vite.config.js, src/worker.js, scripts/sites.mjs and src/site.js,
// so keep it plain JS with no imports.
//
// `title` is the page title, `shortTitle` the shorter version of it, for the nav bar and copy.
// `noun`/`nounPlural` name one entry in the archive ("New Doki", "Doki not found");
// copy that reads lowercase ("Add the doki 'Kiki'") lowercases them.
export const sites = {
    doki: {
        id: "doki",
        slug: "dokinomicon",
        title: "The Dokinomicon",
        shortTitle: "Dokinomicon",
        // The streamer the site is for.
        name: "Dokibird",
        noun: "Doki",
        nounPlural: "Dokis",
        description: "An archive of every Doki in the Dokiverse.",
        themeColor: "#8b5cf6",
    },
    mint: {
        id: "mint",
        slug: "mintonomicon",
        title: "The Mintonomicon",
        shortTitle: "Mintonomicon",
        name: "Mint Fantome",
        noun: "Mint",
        nounPlural: "Mints",
        description: "An archive of every Mint in the Mintoverse.",
        themeColor: "#10b981",
    },
};

export const DEFAULT_SITE = "doki";

/** Returns the site for an id, the default site when the id is empty, and throws on an unknown id. */
export const resolveSite = (id) => {
    const site = sites[id || DEFAULT_SITE];
    if (!site) {
        throw new Error(`Unknown site "${id}". Expected one of: ${Object.keys(sites).join(", ")}`);
    }
    return site;
};
