import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Route, Routes, useOutletContext } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import View from "./pages/View";
import { loadDokiData } from "./utils/dataLoader";

vi.mock("./utils/dataLoader", () => ({
    loadDokiData: vi.fn(),
}));

const HomeRoute = () => {
    const { data } = useOutletContext();
    return <Home data={data} />;
};

const ViewRoute = () => {
    const { data } = useOutletContext();
    return <View data={data} />;
};

const renderApp = () =>
    render(
        <MemoryRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<HomeRoute />} />
                    <Route path="view/:doki_id" element={<ViewRoute />} />
                </Route>
            </Routes>
        </MemoryRouter>,
    );

/** jsdom never scrolls, so the offset the page would be at has to be faked. */
const setScrollY = (y) => Object.defineProperty(window, "scrollY", { value: y, configurable: true });

const mockData = [
    {
        doki_id: "test-doki-1",
        name: "Alpha Doki",
        description: "The first doki.",
        group: "Group A",
        tags: ["tag1"],
        images: {
            Headshot: [{ urlWebp: "img1.webp", image_ext: ".webp" }],
        },
    },
];

describe("App", () => {
    const { matchMedia, scrollTo } = window;

    beforeEach(() => {
        vi.clearAllMocks();
        // jsdom implements neither
        window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        window.scrollTo = vi.fn();
    });

    afterEach(() => {
        window.matchMedia = matchMedia;
        window.scrollTo = scrollTo;
    });

    it("shows the loading screen until the dokis arrive", async () => {
        let resolve;
        loadDokiData.mockReturnValue(new Promise((r) => (resolve = r)));
        renderApp();

        expect(screen.getByText("Loading Dokinomicon...")).toBeInTheDocument();

        resolve(mockData);
        expect(await screen.findByAltText("Alpha Doki")).toBeInTheDocument();
        expect(screen.queryByText("Loading Dokinomicon...")).not.toBeInTheDocument();
    });

    it("shows an error page when the dokis fail to load, and Retry loads them again", async () => {
        loadDokiData.mockRejectedValueOnce(new Error("Failed to fetch")).mockResolvedValueOnce(mockData);
        renderApp();

        expect(await screen.findByRole("heading", { name: "Couldn't load the Dokinomicon" })).toBeInTheDocument();
        expect(screen.queryByText("Loading Dokinomicon...")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        expect(await screen.findByAltText("Alpha Doki")).toBeInTheDocument();
        expect(screen.queryByText("Couldn't load the Dokinomicon")).not.toBeInTheDocument();
        expect(loadDokiData).toHaveBeenCalledTimes(2);
    });

    it("renders the app with an empty state when the site has no dokis yet", async () => {
        loadDokiData.mockResolvedValue([]);
        renderApp();

        expect(await screen.findByRole("heading", { name: "No Dokis yet" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Dokinomicon" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Suggest the first Doki" })).toHaveAttribute("href", "/add");
    });

    it("brands the header for Doki, and its site menu lists both sites with Doki's as current", async () => {
        loadDokiData.mockResolvedValue(mockData);
        renderApp();

        const title = await screen.findByRole("button", { name: "Dokinomicon" });
        // The site menu replaced the header's link to the other site.
        expect(screen.queryByRole("link", { name: /Mintonomicon/ })).not.toBeInTheDocument();

        fireEvent.click(title);
        const menu = screen.getByRole("navigation", { name: "Sites" });
        const [doki, mint, hub] = within(menu).getAllByRole("link");

        expect(doki).toHaveAccessibleName("Dokinomicon Dokibird");
        expect(doki).toHaveAttribute("aria-current", "true");
        expect(doki).toHaveAttribute("href", "/");
        expect(doki.querySelector("img")).toHaveAttribute("src", "/dokinomicon/favicon-32x32.png");

        expect(mint).toHaveAccessibleName("Mintonomicon Mint Fantome");
        expect(mint).not.toHaveAttribute("aria-current");
        expect(mint).toHaveAttribute("href", "/mintonomicon/");
        expect(mint.querySelector("img")).toHaveAttribute(
            "srcset",
            "/mintonomicon/favicon-32x32.png 1x, /mintonomicon/android-chrome-192x192.png 2x",
        );

        expect(hub).toHaveAccessibleName("All my sites");
        expect(hub).toHaveAttribute("href", "https://www.duck-automata.com/");
    });

    it("returns to the spot in the gallery the card was opened from", async () => {
        loadDokiData.mockResolvedValue(mockData);
        renderApp();

        // The user has scrolled down the grid before opening a card
        const card = (await screen.findByAltText("Alpha Doki")).closest("a");
        setScrollY(420);
        fireEvent.click(card);

        // The doki's own page still opens at the top
        expect(await screen.findByRole("heading", { level: 1, name: "Alpha Doki" })).toBeInTheDocument();
        expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: "instant" });

        setScrollY(0);
        fireEvent.click(screen.getByRole("link", { name: /Back to Gallery/ }));

        expect(await screen.findByAltText("Alpha Doki")).toBeInTheDocument();
        expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 420, left: 0, behavior: "instant" });
    });

    it("opens the gallery at the top when it is reached from the nav", async () => {
        loadDokiData.mockResolvedValue(mockData);
        renderApp();

        const card = (await screen.findByAltText("Alpha Doki")).closest("a");
        setScrollY(420);
        fireEvent.click(card);
        await screen.findByRole("heading", { level: 1, name: "Alpha Doki" });

        setScrollY(0);
        fireEvent.click(screen.getByRole("link", { name: "Home" }));

        expect(await screen.findByAltText("Alpha Doki")).toBeInTheDocument();
        expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: "instant" });
    });

    it("follows the system theme", async () => {
        loadDokiData.mockResolvedValue(mockData);
        renderApp();

        await screen.findByAltText("Alpha Doki");
        expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    });
});
