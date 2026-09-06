import { render, screen, fireEvent, within } from "@testing-library/react";
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

    // Deliberately not in alphabetical or chronological order, so "Default" is distinguishable.
    // Mid Doki has no debut date and no artist, to pin the missing-value behaviour.
    const sortData = [
        {
            doki_id: "zeta",
            name: "Zeta Doki",
            debut_date: "2021-06-15",
            artists: "@_zoe",
            group: "Group B",
            tags: [],
            images: { Headshot: [{ urlWebp: "z.webp", image_ext: ".webp" }] },
        },
        {
            doki_id: "alpha",
            name: "Alpha Doki",
            debut_date: "2023-01-01",
            artists: "@amy",
            group: "Group A",
            tags: [],
            images: {
                Headshot: [{ urlWebp: "a.webp", image_ext: ".webp" }],
                Reference: [{ urlWebp: "a2.webp", image_ext: ".webp" }],
            },
        },
        {
            doki_id: "mid",
            name: "Mid Doki",
            debut_date: "",
            artists: "",
            group: "Group C",
            tags: [],
            images: { Headshot: [{ urlWebp: "m.webp", image_ext: ".webp" }] },
        },
    ];

    /** Card titles, in render order. */
    const renderedNames = () => screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);

    const renderHome = (data) =>
        render(
            <MemoryRouter>
                <Home data={data} />
            </MemoryRouter>,
        );

    let mockStore;

    beforeEach(() => {
        mockStore = {
            homeSearchText: "",
            homeSetSearchText: vi.fn(),
            homeFilterGroup: "All",
            homeSetFilterGroup: vi.fn(),
            homeSortBy: "default",
            homeSetSortBy: vi.fn(),
        };

        useAppStore.mockImplementation((selector) => selector(mockStore));
    });

    it("renders all dokis initially", () => {
        renderHome(mockData);

        expect(screen.getByText("Alpha Doki")).toBeInTheDocument();
        expect(screen.getByText("Beta Doki")).toBeInTheDocument();

        // Filter dropdown should have unique groups + All
        const groupSelect = screen.getByLabelText("Group");
        expect(within(groupSelect).getAllByRole("option")).toHaveLength(3); // All, Group A, Group B
    });

    it("filters dokis based on search query", () => {
        // Set search text to match only Alpha
        mockStore.homeSearchText = "alpha";

        renderHome(mockData);

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

        renderHome(mockData);

        expect(screen.queryByText("Alpha Doki")).not.toBeInTheDocument();
        expect(screen.getByText("Beta Doki")).toBeInTheDocument();
    });

    it("renders the sort dropdown defaulted to the csv order", () => {
        renderHome(sortData);

        const sortSelect = screen.getByLabelText("Sort");
        expect(sortSelect).toHaveValue("default");
        expect(within(sortSelect).getAllByRole("option")).toHaveLength(8);
        expect(renderedNames()).toEqual(["Zeta Doki", "Alpha Doki", "Mid Doki"]);
    });

    it("updates the sort when the dropdown changes", () => {
        renderHome(sortData);

        fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "name-asc" } });
        expect(mockStore.homeSetSortBy).toHaveBeenCalledWith("name-asc");
    });

    it("sorts by name in both directions", () => {
        mockStore.homeSortBy = "name-asc";
        const { unmount } = renderHome(sortData);
        expect(renderedNames()).toEqual(["Alpha Doki", "Mid Doki", "Zeta Doki"]);
        unmount();

        mockStore.homeSortBy = "name-desc";
        renderHome(sortData);
        expect(renderedNames()).toEqual(["Zeta Doki", "Mid Doki", "Alpha Doki"]);
    });

    it("keeps dokis with no debut date last in both directions", () => {
        mockStore.homeSortBy = "debut-asc";
        const { unmount } = renderHome(sortData);
        expect(renderedNames()).toEqual(["Zeta Doki", "Alpha Doki", "Mid Doki"]);
        unmount();

        mockStore.homeSortBy = "debut-desc";
        renderHome(sortData);
        expect(renderedNames()).toEqual(["Alpha Doki", "Zeta Doki", "Mid Doki"]);
    });

    it("sorts by artist, ignoring the punctuation in the handle", () => {
        mockStore.homeSortBy = "artist-asc";
        renderHome(sortData);

        // @amy, then @_zoe (the underscore must not float it to the front), then the doki with no artist
        expect(renderedNames()).toEqual(["Alpha Doki", "Zeta Doki", "Mid Doki"]);
    });

    it("sorts by image count", () => {
        mockStore.homeSortBy = "images-desc";
        renderHome(sortData);

        // Alpha has a headshot plus a reference, the other two have one image each
        expect(renderedNames()[0]).toBe("Alpha Doki");
    });

    it("sorts only the filtered results", () => {
        mockStore.homeSortBy = "name-asc";
        mockStore.homeSearchText = "doki";
        mockStore.homeFilterGroup = "Group A";

        renderHome(sortData);

        expect(renderedNames()).toEqual(["Alpha Doki"]);
    });

    it("does not mutate the data prop", () => {
        mockStore.homeSortBy = "name-asc";
        const originalOrder = sortData.map((doki) => doki.doki_id);

        renderHome(sortData);

        expect(sortData.map((doki) => doki.doki_id)).toEqual(originalOrder);
    });

    it("renders one card per headshot", () => {
        const multiData = [
            {
                doki_id: "multi",
                name: "Multi Doki",
                group: "Group A",
                tags: [],
                images: {
                    Headshot: [
                        { urlWebp: "one.webp", image_ext: ".webp" },
                        { urlWebp: "two.webp", image_ext: ".webp" },
                    ],
                },
            },
        ];

        renderHome(multiData);

        expect(renderedNames()).toEqual(["Multi Doki", "Multi Doki"]);
    });
});
