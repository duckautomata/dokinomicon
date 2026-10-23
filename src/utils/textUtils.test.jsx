import { describe, it, expect, test } from "vitest";
import { renderTextWithLinks, formatUrlForDisplay, toHref } from "./textUtils";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

describe("textUtils", () => {
    describe("toHref", () => {
        it("prefixes bare www. urls with https://", () => {
            expect(toHref("www.example.com/a")).toBe("https://www.example.com/a");
        });

        it("leaves urls that already have a scheme alone, trimming whitespace", () => {
            expect(toHref("  https://example.com/a  ")).toBe("https://example.com/a");
            expect(toHref("http://example.com")).toBe("http://example.com");
        });
    });

    describe("formatUrlForDisplay", () => {
        it("returns falsy input unchanged", () => {
            expect(formatUrlForDisplay("")).toBe("");
            expect(formatUrlForDisplay(null)).toBeNull();
        });

        it("drops the scheme and any trailing slash", () => {
            expect(formatUrlForDisplay("https://www.youtube.com/watch?v=abc")).toBe("www.youtube.com/watch?v=abc");
            expect(formatUrlForDisplay("http://example.com/")).toBe("example.com");
        });

        it("leaves the rest of the url alone, however long", () => {
            expect(formatUrlForDisplay("www.example.com")).toBe("www.example.com");
            expect(formatUrlForDisplay("https://x.com/dokibird/status/1763280183551734269")).toBe(
                "x.com/dokibird/status/1763280183551734269",
            );
        });
    });

    describe("renderTextWithLinks", () => {
        it("returns the original text if empty or null", () => {
            expect(renderTextWithLinks(null)).toBeNull();
            expect(renderTextWithLinks("")).toBe("");
        });

        const testCases = [
            ["No links here", "No links here", 0],
            ["Check out https://google.com for more info.", "Check out https://google.com for more info.", 1],
            ["Visit www.example.com or http://test.org", "Visit www.example.com or http://test.org", 2],
            ["Link at the end: http://end.com", "Link at the end: http://end.com", 1],
            ["http://start.com link at the start", "http://start.com link at the start", 1],
            ["Multiple links: https://a.com and https://b.com", "Multiple links: https://a.com and https://b.com", 2],
        ];

        test.each(testCases)('renders correctly for: "%s"', (input, expectedTextContent, expectedLinksCount) => {
            const result = renderTextWithLinks(input);

            // To test React elements easily without complex tree traversal,
            // we render it wrapped in a div
            const { container } = render(<div>{result}</div>);

            expect(container.textContent).toBe(expectedTextContent);
            const links = container.querySelectorAll("a");
            expect(links.length).toBe(expectedLinksCount);

            // Additional checks that link props are correct
            links.forEach((link) => {
                expect(link).toHaveAttribute("target", "_blank");
                expect(link).toHaveAttribute("rel", "noopener noreferrer");
                expect(link).toHaveClass("text-link");

                // Ensure www. links are prefixed with https://
                const href = link.getAttribute("href");
                expect(href.startsWith("http")).toBe(true);
            });
        });
    });
});
