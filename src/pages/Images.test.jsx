import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Images from "./Images";
import { useAppStore } from "../store/store";

vi.mock("../store/store", () => ({
    useAppStore: vi.fn(),
}));

describe("Images", () => {
    const mockData = [
        {
            doki_id: "test-doki-1",
            name: "Test Doki One",
            images: {
                Headshot: [{ image_name: "Headshot 1", urlWebp: "img1.webp", image_type: "Headshot" }],
                Asset: [{ image_name: "Asset 1", urlWebp: "img2.webp", image_type: "Asset" }],
            },
        },
    ];

    let mockStore;

    beforeEach(() => {
        mockStore = {
            imageSearchText: "",
            setImageSearchText: vi.fn(),
            imageFilterType: "All",
            setImageFilterType: vi.fn(),
        };

        useAppStore.mockImplementation((selector) => selector(mockStore));
    });

    it("renders all images initially", () => {
        render(<Images data={mockData} />);

        expect(screen.getByText("Headshot 1")).toBeInTheDocument();
        expect(screen.getByText("Asset 1")).toBeInTheDocument();

        // Filter dropdown should have unique types + All
        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(3); // All, Asset, Headshot
    });

    it("filters images based on search query", () => {
        // Search text matching Asset
        mockStore.imageSearchText = "asset";

        render(<Images data={mockData} />);

        expect(screen.getByText("Asset 1")).toBeInTheDocument();
        expect(screen.queryByText("Headshot 1")).not.toBeInTheDocument();

        const clearBtn = screen.getByLabelText("Clear search");
        fireEvent.click(clearBtn);

        expect(mockStore.setImageSearchText).toHaveBeenCalledWith("");
    });

    it("filters images based on type dropdown", () => {
        // Type matching Headshot
        mockStore.imageFilterType = "Headshot";

        render(<Images data={mockData} />);

        expect(screen.getByText("Headshot 1")).toBeInTheDocument();
        expect(screen.queryByText("Asset 1")).not.toBeInTheDocument();
    });

    it("shows empty state when no images match", () => {
        mockStore.imageSearchText = "nonexistent";

        render(<Images data={mockData} />);

        expect(screen.getByText("No images found matching your search.")).toBeInTheDocument();
        expect(screen.queryByText("Headshot 1")).not.toBeInTheDocument();
    });
});
