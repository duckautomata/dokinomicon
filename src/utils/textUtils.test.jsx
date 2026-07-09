import { describe, it, expect, test } from "vitest";
import { renderTextWithLinks } from "./textUtils";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

describe("textUtils", () => {
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
