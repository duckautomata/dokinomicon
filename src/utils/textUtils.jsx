export function renderTextWithLinks(text) {
    if (!text) return text;

    // Regex to match URLs starting with http://, https://, or www.
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (urlRegex.test(part)) {
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
