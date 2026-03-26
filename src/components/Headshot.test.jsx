import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Headshot from "./Headshot";

describe("Headshot", () => {
    const mockDoki = {
        doki_id: "123",
        name: "Test Doki",
        artists: "Test Artist",
        debut_date: "2023-01-01",
        group: "Test Group",
    };

    const mockHeadshot = {
        urlWebp: "test-url.webp",
        image_ext: ".webp",
    };

    it("renders with image correctly", () => {
        render(
            <MemoryRouter>
                <Headshot doki={mockDoki} headshot={mockHeadshot} />
            </MemoryRouter>,
        );

        expect(screen.getByText("Test Doki")).toBeInTheDocument();
        expect(screen.getByText("Artist: Test Artist")).toBeInTheDocument();
        expect(screen.getByText("Debut: 2023-01-01")).toBeInTheDocument();
        expect(screen.getByText("Group: Test Group")).toBeInTheDocument();

        const img = screen.getByRole("img", { name: "Test Doki" });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "test-url.webp");
    });

    it("renders placeholder without headshot", () => {
        render(
            <MemoryRouter>
                <Headshot doki={mockDoki} />
            </MemoryRouter>,
        );

        expect(screen.getByText("T")).toBeInTheDocument(); // First letter of name
        const img = screen.queryByRole("img");
        expect(img).not.toBeInTheDocument();
    });
});
