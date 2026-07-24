import { contentApi, siteName } from "../config";

let cachedConfig = null;
let inFlightConfig = null;

const readErrorDetail = async (res) => {
    try {
        const body = await res.json();
        if (body && typeof body.detail === "string") return body.detail;
    } catch {
        // ignore JSON parse errors; fall back to status text
    }
    return `${res.status} ${res.statusText}`.trim();
};

export const fetchPublicConfig = async () => {
    if (cachedConfig) return cachedConfig;
    if (inFlightConfig) return inFlightConfig;

    inFlightConfig = (async () => {
        const res = await fetch(`${contentApi}/public/config`);
        if (!res.ok) {
            throw new Error(`Failed to load public config: ${await readErrorDetail(res)}`);
        }
        cachedConfig = await res.json();
        return cachedConfig;
    })().finally(() => {
        inFlightConfig = null;
    });

    return inFlightConfig;
};

export const uploadImage = async ({ token, file }) => {
    const formData = new FormData();
    formData.append("cf_turnstile_response", token);
    formData.append("file", file);

    const res = await fetch(`${contentApi}/public/image`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) {
        throw new Error(await readErrorDetail(res));
    }
    return res.json();
};

export const submitSuggestion = async ({ token, kind, payload, imageIds = [], site = siteName }) => {
    const res = await fetch(`${contentApi}/public/suggestion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cf_turnstile_response: token,
            site,
            kind,
            payload,
            image_ids: imageIds,
        }),
    });
    if (!res.ok) {
        throw new Error(await readErrorDetail(res));
    }
    return res.json();
};

// The server accepts at most 50 ids per request; chunk so power users don't 400.
const STATUS_CHUNK_SIZE = 50;

export const fetchSuggestionStatuses = async (ids) => {
    const unique = [...new Set(ids)];
    const results = { suggestions: [], not_found: [] };
    for (let i = 0; i < unique.length; i += STATUS_CHUNK_SIZE) {
        const chunk = unique.slice(i, i + STATUS_CHUNK_SIZE);
        const res = await fetch(`${contentApi}/public/suggestions?ids=${encodeURIComponent(chunk.join(","))}`);
        if (!res.ok) {
            throw new Error(await readErrorDetail(res));
        }
        const data = await res.json();
        results.suggestions.push(...(data.suggestions ?? []));
        results.not_found.push(...(data.not_found ?? []));
    }
    return results;
};
