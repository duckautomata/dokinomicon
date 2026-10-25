import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Route, Routes, useOutletContext } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import { cdn, siteName } from "./config";
import { saveSuggestionId } from "./utils/suggestionIds";

// Builds as Mint. config.jsx reads the site from this module too, so cdn and
// siteName follow.
vi.mock("./site", async () => {
    const { sites } = await import("../sites.config.js");
    return { site: sites.mint };
});

const HomeRoute = () => {
    const { data } = useOutletContext();
    return <Home data={data} />;
};

const renderApp = () =>
    render(
        <MemoryRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<HomeRoute />} />
                </Route>
            </Routes>
        </MemoryRouter>,
    );

// Header-only files, as a brand-new site has them.
const HEADER_ONLY_CSVS = {
    "data.csv": "doki_id,name,debut_date,debut_stream,artists,description,group,parent_id,tags\n",
    "images.csv": "doki_id,image_id,image_ext,image_name,source,image_type\n",
};

describe("App built for Mint", () => {
    const { matchMedia, scrollTo } = window;

    beforeEach(() => {
        localStorage.clear();
        // jsdom implements neither
        window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        window.scrollTo = vi.fn();
    });

    afterEach(() => {
        window.matchMedia = matchMedia;
        window.scrollTo = scrollTo;
        vi.restoreAllMocks();
    });

    it("reads Mint's data from the mintonomicon CDN folder", () => {
        expect(siteName).toBe("mintonomicon");
        expect(cdn).toBe("https://content.duck-automata.com/mintonomicon");
    });

    it("brands the header for Mint, marks Mint's site current in the site menu and loads Mint's CSVs", async () => {
        const fetchSpy = vi
            .spyOn(globalThis, "fetch")
            .mockImplementation((url) => Promise.resolve(new Response(HEADER_ONLY_CSVS[String(url).split("/").pop()])));
        renderApp();

        expect(screen.getByText("Loading Mintonomicon...")).toBeInTheDocument();
        const title = await screen.findByRole("button", { name: "Mintonomicon" });
        expect(fetchSpy).toHaveBeenCalledWith("https://content.duck-automata.com/mintonomicon/data.csv");
        expect(fetchSpy).toHaveBeenCalledWith("https://content.duck-automata.com/mintonomicon/images.csv");

        // Same order as on Doki's site, so the rows don't move when switching.
        fireEvent.click(title);
        const menu = screen.getByRole("navigation", { name: "Sites" });
        const [doki, mint] = within(menu).getAllByRole("link");

        expect(doki).toHaveAccessibleName("Dokinomicon Dokibird");
        expect(doki).not.toHaveAttribute("aria-current");
        expect(doki).toHaveAttribute("href", "/dokinomicon/");
        expect(doki.querySelector("img")).toHaveAttribute("src", "/dokinomicon/favicon-32x32.png");

        expect(mint).toHaveAccessibleName("Mintonomicon Mint Fantome");
        expect(mint).toHaveAttribute("aria-current", "true");
        expect(mint).toHaveAttribute("href", "/");
        fireEvent.click(mint);
        expect(screen.queryByRole("navigation", { name: "Sites" })).not.toBeInTheDocument();

        // Header-only CSVs are a brand-new site, not an error.
        expect(screen.getByRole("heading", { name: "No Mints yet" })).toBeInTheDocument();
        expect(screen.getByText(/The Mintonomicon doesn't have any Mints yet/)).toBeInTheDocument();
        expect(screen.getByText(/Mint Fantome's characters/)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Suggest the first Mint" })).toHaveAttribute("href", "/add");
    });

    it("saves suggestion ids under Mint's own key", () => {
        localStorage.setItem("suggestion_ids:dokinomicon", JSON.stringify([{ id: "sug_doki", savedAt: "x" }]));

        expect(saveSuggestionId("sug_mint").map((entry) => entry.id)).toEqual(["sug_mint"]);
        expect(localStorage.getItem("suggestion_ids:mintonomicon")).toContain("sug_mint");
        expect(localStorage.getItem("suggestion_ids:dokinomicon")).not.toContain("sug_mint");
    });
});
