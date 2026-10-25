// oxlint-disable no-console
// Runs Vite once per site (see sites.config.js).
//
//   node scripts/sites.mjs build [vite args]       builds every site into dist/<slug>/
//   node scripts/sites.mjs dev <site> [vite args]  starts the dev server for one site
//
// `wrangler deploy` uploads the whole dist/ folder and replaces what was there, so
// always build with `npm run build`: a plain `vite build` only builds the default site.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_SITE, resolveSite, sites } from "../sites.config.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");

// Files index.html and site.webmanifest expect in public/<id>/.
const PUBLIC_FILES = [
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "site_preview.png",
    "site.webmanifest",
];

const fail = (message) => {
    console.error(`\n${message}`);
    process.exit(1);
};

const runVite = (site, args) =>
    spawnSync(process.execPath, [viteBin, ...args], {
        cwd: root,
        stdio: "inherit",
        env: { ...process.env, VITE_SITE: site.id },
    }).status;

const listFiles = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? listFiles(full) : [full];
    });

const build = (args) => {
    // Start clean so a site removed from the config doesn't linger in dist/ and get deployed.
    fs.rmSync(path.join(root, "dist"), { recursive: true, force: true });

    const all = Object.values(sites);
    for (const site of all) {
        console.log(`\nBuilding ${site.title} (${site.id}) into dist/${site.slug}/`);
        if (runVite(site, ["build", ...args]) !== 0) fail(`vite build failed for site "${site.id}".`);
    }

    for (const site of all) {
        const outDir = path.join(root, "dist", site.slug);
        if (!fs.existsSync(path.join(outDir, "index.html"))) fail(`dist/${site.slug}/index.html is missing.`);

        // A hardcoded base path (e.g. "/dokimotes/") would make one site load another's files.
        const otherBases = all.filter((s) => s.id !== site.id).map((s) => `/${s.slug}/`);
        for (const file of listFiles(outDir).filter((f) => /\.(html|js|css|webmanifest|json)$/.test(f))) {
            const text = fs.readFileSync(file, "utf8");
            const leaked = otherBases.find((base) => text.includes(base));
            if (leaked) fail(`${path.relative(root, file)} contains "${leaked}", which belongs to another site.`);
        }

        const missing = PUBLIC_FILES.filter((f) => !fs.existsSync(path.join(root, "public", site.id, f)));
        if (missing.length) console.warn(`\nWarning: public/${site.id}/ is missing ${missing.join(", ")}`);
    }
};

const [command, ...rest] = process.argv.slice(2);
if (command === "build") {
    build(rest);
} else if (command === "dev") {
    const [id = DEFAULT_SITE, ...args] = rest;
    process.exit(runVite(resolveSite(id), args) ?? 1);
} else {
    fail("Usage: node scripts/sites.mjs build [vite args] | dev <site> [vite args]");
}
