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
});
