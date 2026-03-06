import Papa from "papaparse";
import { LOG_ERROR } from "./debug";

const CDN_BASE = "https://content.duck-automata.com/dokinomicon";

const fetchAndParseCSV = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const text = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

export const loadDokiData = async () => {
    try {
        const [dataRows, imageRows] = await Promise.all([
            fetchAndParseCSV(`${CDN_BASE}/data.csv`),
            fetchAndParseCSV(`${CDN_BASE}/images.csv`),
        ]);

        // Group images by doki_id and image_type
        const imagesByDoki = {};
        imageRows.forEach((row) => {
            const { doki_id, image_id, image_ext, image_name, source, image_type } = row;
            if (!imagesByDoki[doki_id]) {
                imagesByDoki[doki_id] = {};
            }
            if (!imagesByDoki[doki_id][image_type]) {
                imagesByDoki[doki_id][image_type] = [];
            }

            imagesByDoki[doki_id][image_type].push({
                image_id,
                image_ext,
                image_name,
                source,
                image_type,
                urlOrig: `${CDN_BASE}/${image_id}${image_ext}`,
                urlWebp: `${CDN_BASE}/${image_id}_p.webp`,
                urlThumb: `${CDN_BASE}/${image_id}_t.webp`,
            });
        });

        // Parse doki data and attach images/alts
        const parsedData = dataRows.map((row) => {
            const doki_id = row.doki_id;

            // Find alts (dokis whose parent_id is this doki)
            const alts = dataRows.filter((d) => d.parent_id === doki_id).map((d) => d.doki_id);

            return {
                ...row,
                description: row.description ? row.description.replace(/\\n/g, "\n").replace(/\\t/g, "\t") : "",
                tags: row.tags ? row.tags.split(",").map((tag) => tag.trim()) : [],
                alts,
                images: imagesByDoki[doki_id] || {},
            };
        });

        return parsedData;
    } catch (error) {
        LOG_ERROR("Error loading doki data:", error);
        return [];
    }
};
