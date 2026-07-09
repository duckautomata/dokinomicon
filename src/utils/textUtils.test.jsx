import { describe, it, expect, test } from "vitest";
import { renderTextWithLinks, sanitizeFilename } from "./textUtils";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

describe("textUtils", () => {
    describe("sanitizeFilename", () => {
        it("returns the fallback for empty/nullish names", () => {
            expect(sanitizeFilename("")).toBe("image");
            expect(sanitizeFilename(null)).toBe("image");
            expect(sanitizeFilename(undefined)).toBe("image");
            expect(sanitizeFilename("", "abc123")).toBe("abc123");
        });

        it("replaces illegal filesystem characters with underscores", () => {
            expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe("a_b_c_d_e_f_g_h_i_j");
        });

        it("trims surrounding whitespace", () => {
            expect(sanitizeFilename("  Happy Cat  ")).toBe("Happy Cat");
        });

        it("returns the fallback when only whitespace remains", () => {
            expect(sanitizeFilename("   ", "fallback")).toBe("fallback");
        });

        it("leaves valid names untouched", () => {
            expect(sanitizeFilename("Happy Cat (1)")).toBe("Happy Cat (1)");
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
