import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import View from "./View";

describe("View", () => {
    const mockData = [
        {
            doki_id: "test-doki-1",
            name: "Test Doki One",
            description: "A cool test doki.",
            artists: "Test Artist",
            debut_date: "2023-01-01",
            debut_stream: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            group: "Test Group",
            tags: ["Cool", "Test"],
            images: {
                Headshot: [
                    {
                        urlWebp: "headshot1.webp",
                        image_ext: ".webp",
                        image_name: "Headshot 1",
                    },
                ],
                Reference: [
                    {
                        urlWebp: "ref1.webp",
                        image_ext: ".webp",
                        image_name: "Ref 1",
                    },
                ],
            },
        },
    ];

    it("renders Doki not found if id doesn't match", () => {
        render(
            <MemoryRouter initialEntries={["/view/unknown"]}>
                <Routes>
                    <Route path="/view/:doki_id" element={<View data={mockData} />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText("Doki not found")).toBeInTheDocument();
        expect(screen.getByText("Return Home")).toBeInTheDocument();
    });

    it("renders Doki details if id matches", () => {
        render(
            <MemoryRouter initialEntries={["/view/test-doki-1"]}>
                <Routes>
                    <Route path="/view/:doki_id" element={<View data={mockData} />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByRole("heading", { name: "Test Doki One" })).toBeInTheDocument();
        expect(screen.getByText("A cool test doki.")).toBeInTheDocument();
        expect(screen.getByText("Test Artist")).toBeInTheDocument();
        expect(screen.getByText("2023-01-01")).toBeInTheDocument();
        expect(screen.getByText("Test Group")).toBeInTheDocument();

        // Tags
        expect(screen.getByText("Cool")).toBeInTheDocument();
        expect(screen.getByText("Test")).toBeInTheDocument();

        // Image sections
        expect(screen.getByRole("heading", { name: "Reference" })).toBeInTheDocument();

        // There should be two images (hero + 1 ref)
        const images = screen.getAllByRole("img");
        expect(images).toHaveLength(2);
    });

    it("shows the debut stream url itself as the link text", () => {
        render(
            <MemoryRouter initialEntries={["/view/test-doki-1"]}>
                <Routes>
                    <Route path="/view/:doki_id" element={<View data={mockData} />} />
                </Routes>
            </MemoryRouter>,
        );

        const link = screen.getByRole("link", { name: "www.youtube.com/watch?v=dQw4w9WgXcQ" });
        expect(link).toHaveAttribute("href", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("title", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        expect(screen.queryByText("Watch VOD")).not.toBeInTheDocument();
    });

    const renderWithDebutStream = (debut_stream) => {
        const data = [{ ...mockData[0], debut_stream }];
        render(
            <MemoryRouter initialEntries={["/view/test-doki-1"]}>
                <Routes>
                    <Route path="/view/:doki_id" element={<View data={data} />} />
                </Routes>
            </MemoryRouter>,
        );
    };

    const streamUrls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://www.twitch.tv/videos/123456789",
        "www.youtube.com/watch?v=dQw4w9WgXcQ",
    ];

    it.each(streamUrls)('labels %s as "Debut Stream"', (url) => {
        renderWithDebutStream(url);

        expect(screen.getByText("Debut Stream")).toBeInTheDocument();
        expect(screen.queryByText("Source")).not.toBeInTheDocument();
    });

    const sourceUrls = [
        "https://x.com/dokibird/status/1763280183551734269",
        "https://twitter.com/dokibird/status/1763280183551734269",
        "https://notyoutube.com/watch?v=abc",
        "not a url at all",
    ];

    it.each(sourceUrls)('labels %s as "Source"', (url) => {
        renderWithDebutStream(url);

        expect(screen.getByText("Source")).toBeInTheDocument();
        expect(screen.queryByText("Debut Stream")).not.toBeInTheDocument();
    });
});
