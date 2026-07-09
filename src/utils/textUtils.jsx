// Same URL shape used in two ways: a global+capturing regex to find/split URLs
// inside larger text, and an anchored variant to test whether an entire
// trimmed string IS a URL. Built from one source so the rules stay in sync.
const URL_BODY = String.raw`https?:\/\/[^\s]+|www\.[^\s]+`;
const URL_REGEX_GLOBAL = new RegExp(`(${URL_BODY})`, "g");
const URL_REGEX_EXACT = new RegExp(`^(?:${URL_BODY})$`);

/**
 * Returns true if the given (trimmed) text is itself a URL — http://, https://,
 * or www.-prefixed. Use to decide whether a string should render as a clickable
 * link or as plain text.
 *
 * @param {string | null | undefined} text
 * @returns {boolean}
 */
export const isUrl = (text) => !!text && URL_REGEX_EXACT.test(text.trim());

/**
 * Sanitizes a string for use as a filename. Replaces characters that are
 * illegal on common filesystems (/ \ : * ? " < > |) with underscores and
 * trims surrounding whitespace. Returns `fallback` when nothing usable remains.
 *
 * @param {string | null | undefined} name
 * @param {string} [fallback="image"]
 * @returns {string}
 */
export const sanitizeFilename = (name, fallback = "image") => {
    if (!name) return fallback;
    const cleaned = name.replace(/[/\\:*?"<>|]/g, "_").trim();
    return cleaned || fallback;
};

/**
 * Renders text, converting URLs into clickable external links.
 *
 * @param {string} text - The input text to process
 * @returns {string|JSX.Element[]} The processed content with link elements
 */
export function renderTextWithLinks(text) {
    if (!text) return text;

    const parts = text.split(URL_REGEX_GLOBAL);

    return parts.map((part, index) => {
        // Use the anchored regex here so the test only matches when the whole
        // part is a URL (and avoids the global-regex `lastIndex` gotcha that
        // would skip matches on repeated `.test()` calls).
        if (URL_REGEX_EXACT.test(part)) {
            const href = part.startsWith("www.") ? `https://${part}` : part;
            return (
                <a
                    key={index}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link"
                    onClick={(e) => e.stopPropagation()} // Prevent triggering parent click handlers
                >
                    {part}
                </a>
            );
        }
        return part;
    });
}
