import { siteName } from "../config";
import { LOG_MSG } from "./debug";

const MOCK_CONFIG = Object.freeze({
    turnstile_site_key: "mock-site-key",
    turnstile_enabled: true,
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
let statusCount = 0;

// Ids submitted this session always report as freshly pending; the value is
// the summary that was submitted with them.
const sessionSubmittedIds = new Map();

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

// Server cap on the human-readable one-liner sent with a suggestion. Omitting
// it is allowed; the server then derives one from the payload.
export const SUMMARY_MAX_LENGTH = 300;

export const submitSuggestion = async ({ token, kind, payload, imageIds = [], summary = "", site = siteName }) => {
    await sleep(randomDelay(400, 800));
    submitCount += 1;

    const trimmedSummary = summary.trim().slice(0, SUMMARY_MAX_LENGTH);
    const result = { id: `sug_${randomId(13)}` };
    // Mirrors the server's auto-generated summary when the client omits one.
    sessionSubmittedIds.set(result.id, trimmedSummary || `${kind} suggestion (auto-generated summary)`);

    LOG_MSG(`[mock] submitSuggestion #${submitCount} →`, {
        request: {
            cf_turnstile_response: token,
            site,
            kind,
            payload,
            image_ids: imageIds,
            ...(trimmedSummary ? { summary: trimmedSummary } : {}),
        },
        response: result,
    });

    return result;
};

const hashId = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
        hash = (hash * 31 + id.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
};

const MOCK_STATUSES = ["pending", "approved", "rejected", "completed"];
const MOCK_KINDS = ["new", "edit", "delete"];
const MOCK_FEEDBACK = {
    approved: "Mock feedback: looks great!\nCropping the headshot slightly before it goes live.",
    rejected: "Mock feedback: duplicate of an existing doki.",
};

const MOCK_SUMMARIES = {
    new: "Add the doki 'Mock Doki'",
    edit: "Fix the debut date on 'Mock Doki'",
    delete: "Remove the duplicate doki 'Mock Doki'",
};

// Mirrors GET /api/public/suggestions/{site}. Statuses are derived
// deterministically from the id so reloading the page keeps them stable; ids
// containing "missing" or "notfound" simulate deleted/unknown suggestions, and
// ids containing "motes" simulate suggestions that belong to dokimotes (which
// the server scopes out into not_found).
export const fetchSuggestionStatuses = async (ids, site = siteName) => {
    await sleep(randomDelay(200, 500));
    statusCount += 1;

    if (!MOCK_CONFIG.allowed_sites.includes(site)) {
        throw new Error(`Unknown site '${site}'`);
    }

    const unique = [...new Set(ids)];
    const results = { suggestions: [], not_found: [] };
    const now = Date.now();

    for (const id of unique) {
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
            throw new Error("Invalid suggestion id");
        }
        const lower = id.toLowerCase();
        const idSite = lower.includes("motes") ? "dokimotes" : siteName;
        // Another site's ids are reported as not_found, never returned.
        if (lower.includes("missing") || lower.includes("notfound") || idSite !== site) {
            results.not_found.push(id);
            continue;
        }
        const hash = hashId(id);
        const isSessionId = sessionSubmittedIds.has(id);
        const status = isSessionId ? "pending" : MOCK_STATUSES[hash % MOCK_STATUSES.length];
        const kind = isSessionId ? "new" : MOCK_KINDS[hash % MOCK_KINDS.length];
        const submittedAt = new Date(now - (hash % 14) * 86400000 - (hash % 7) * 3600000);
        const updatedAt =
            status === "pending" ? submittedAt : new Date(submittedAt.getTime() + ((hash % 3) + 1) * 86400000);
        results.suggestions.push({
            id,
            site,
            kind,
            status,
            summary: isSessionId ? sessionSubmittedIds.get(id) : MOCK_SUMMARIES[kind],
            submitted_at: submittedAt.toISOString(),
            updated_at: updatedAt.toISOString(),
            admin_context: MOCK_FEEDBACK[status] ?? "",
        });
    }

    LOG_MSG(`[mock] fetchSuggestionStatuses #${statusCount} →`, { request: { ids, site }, response: results });

    return results;
};
