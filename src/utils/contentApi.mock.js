import { siteName } from "../config";
import { LOG_MSG } from "./debug";

const MOCK_CONFIG = Object.freeze({
    turnstile_site_key: "mock-site-key",
    allowed_sites: ["dokimotes", "dokinomicon"],
    max_image_bytes: 26214400,
    supported_formats: ["jpg", "jpeg", "png", "webp", "avif", "gif", "mp4"],
    public_url_prefix: "https://cdn.mock",
    pending_prefix: "_suggestions/_pending/",
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomDelay = (min, max) => Math.floor(min + Math.random() * (max - min));

const randomId = (length = 11) => {
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < length; i += 1) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
};

const extOf = (filename) => {
    const dot = filename.lastIndexOf(".");
    return dot === -1 ? "" : filename.slice(dot).toLowerCase();
};

let uploadCount = 0;
let submitCount = 0;

export const fetchPublicConfig = async () => {
    await sleep(randomDelay(50, 150));
    LOG_MSG("[mock] fetchPublicConfig →", MOCK_CONFIG);
    return MOCK_CONFIG;
};

export const uploadImage = async ({ token, file }) => {
    await sleep(randomDelay(300, 700));
    uploadCount += 1;

    const id = randomId();
    const ext = extOf(file.name) || ".png";
    const objectUrl = URL.createObjectURL(file);
    const result = {
        id,
        ext,
        urls: {
            original: objectUrl,
            preview: objectUrl,
            thumbnail: objectUrl,
        },
    };

    LOG_MSG(`[mock] uploadImage #${uploadCount} →`, {
        request: { token, file: { name: file.name, size: file.size, type: file.type } },
        response: result,
    });

    return result;
};

export const submitSuggestion = async ({ token, kind, payload, imageIds = [], site = siteName }) => {
    await sleep(randomDelay(400, 800));
    submitCount += 1;

    const result = { id: `sug_${randomId(13)}` };

    LOG_MSG(`[mock] submitSuggestion #${submitCount} →`, {
        request: {
            cf_turnstile_response: token,
            site,
            kind,
            payload,
            image_ids: imageIds,
        },
        response: result,
    });

    return result;
};
