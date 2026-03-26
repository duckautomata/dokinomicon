import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { useAppStore } from "../store/store";

// Mock zustand store
vi.mock("../store/store", () => ({
    useAppStore: vi.fn(),
}));

describe("Home", () => {
    const mockData = [
        {
            doki_id: "test-doki-1",
            name: "Alpha Doki",
            group: "Group A",
            tags: ["tag1"],
            images: {
                Headshot: [{ urlWebp: "img1.webp", image_ext: ".webp" }],
            },
        },
        {
            doki_id: "test-doki-2",
            name: "Beta Doki",
            group: "Group B",
            tags: ["tag2"],
            images: {
                Headshot: [{ urlWebp: "img2.webp", image_ext: ".webp" }],
            },
        },
    ];

    let mockStore;

    beforeEach(() => {
        mockStore = {
            homeSearchText: "",
            homeSetSearchText: vi.fn(),
            homeFilterGroup: "All",
            homeSetFilterGroup: vi.fn(),
        };

        useAppStore.mockImplementation((selector) => selector(mockStore));
    });

    it("renders all dokis initially", () => {
        render(
            <MemoryRouter>
                <Home data={mockData} />
            </MemoryRouter>,
        );

        expect(screen.getByText("Alpha Doki")).toBeInTheDocument();
        expect(screen.getByText("Beta Doki")).toBeInTheDocument();

        // Filter dropdown should have unique groups + All
        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(3); // All, Group A, Group B
    });

    it("filters dokis based on search query", () => {
        // Set search text to match only Alpha
        mockStore.homeSearchText = "alpha";

        render(
            <MemoryRouter>
                <Home data={mockData} />
            </MemoryRouter>,
        );

        expect(screen.getByText("Alpha Doki")).toBeInTheDocument();
        expect(screen.queryByText("Beta Doki")).not.toBeInTheDocument();

        // Clear search button should be visible
        const clearBtn = screen.getByLabelText("Clear search");
        expect(clearBtn).toBeInTheDocument();

        fireEvent.click(clearBtn);
        expect(mockStore.homeSetSearchText).toHaveBeenCalledWith("");
    });

    it("filters dokis based on group", () => {
        // Set filter group to match only Group B
        mockStore.homeFilterGroup = "Group B";

        render(
            <MemoryRouter>
                <Home data={mockData} />
            </MemoryRouter>,
        );

        expect(screen.queryByText("Alpha Doki")).not.toBeInTheDocument();
        expect(screen.getByText("Beta Doki")).toBeInTheDocument();
    });
});
