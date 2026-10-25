// oxlint-disable no-console
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { resolveSite } from "./sites.config.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const buildTime = new Date().getTime();
    const env = loadEnv(mode, process.cwd());
    // One build per site. `npm run build` builds them all (scripts/sites.mjs).
    const site = resolveSite(process.env.VITE_SITE);
    const outDir = `dist/${site.slug}`; // should be the same as base

    return {
        plugins: [
            react(),
            {
                name: "generate-version-json",
                writeBundle(options) {
                    const versionFilePath = path.resolve(options.dir || outDir, "version.json");
                    fs.writeFileSync(versionFilePath, JSON.stringify({ buildTime }));
                    console.log(`\nGenerated version.json with buildTime: ${buildTime}`);
                },
            },
        ],
        base: `/${site.slug}/`,
        publicDir: `public/${site.id}`,
        define: {
            __BUILD_TIME__: buildTime,
            // Also fills the matching %TOKENS% in index.html.
            "import.meta.env.VITE_SITE": JSON.stringify(site.id),
            "import.meta.env.VITE_PAGE_TITLE": JSON.stringify(`${site.title}${env.VITE_TITLE_SUFFIX ?? ""}`),
            "import.meta.env.VITE_SITE_DESCRIPTION": JSON.stringify(site.description),
            "import.meta.env.VITE_SITE_THEME_COLOR": JSON.stringify(site.themeColor),
        },
        server: {
            port: 5173,
            open: false,
        },
        build: {
            emptyOutDir: true,
            manifest: false,
            target: "esnext",
            outDir,
            rollupOptions: {
                output: {
                    manualChunks: (id) => {
                        if (id.includes("node_modules")) {
                            return "vendor";
                        }
                    },
                },
            },
        },
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: ["./src/setupTests.js"],
        },
    };
});
