import { describe, it, expect, vi, afterEach } from "vitest";
import { loadDokiData } from "./dataLoader";
import { cdn } from "../config";

const DATA_HEADER = "doki_id,name,debut_date,debut_stream,artists,description,group,parent_id,tags";
const IMAGES_HEADER = "doki_id,image_id,image_ext,image_name,source,image_type";

const csvResponse = (text, init = { status: 200 }) => Promise.resolve(new Response(text, init));

/** Serves each csv by file name; a file missing from `files` is a 404. */
const mockFetch = (files) =>
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        const name = String(url).split("/").pop();
        return name in files ? csvResponse(files[name]) : csvResponse("Not Found", { status: 404 });
    });

describe("loadDokiData", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("fetches data.csv and images.csv from this site's CDN folder and joins them", async () => {
        const fetchSpy = mockFetch({
            "data.csv": `${DATA_HEADER}\nd1,Alpha Doki,2024-01-01,,@artist,Line one\\nLine two,Group A,,"cute, idol"\nd2,Alt Doki,,,,,Group A,d1,\n`,
            "images.csv": `${IMAGES_HEADER}\nd1,img1,.png,Alpha,@artist,Headshot\n`,
        });

        const data = await loadDokiData();

        expect(fetchSpy).toHaveBeenCalledWith(`${cdn}/data.csv`);
        expect(fetchSpy).toHaveBeenCalledWith(`${cdn}/images.csv`);
        expect(data).toHaveLength(2);
        expect(data[0]).toMatchObject({
            doki_id: "d1",
            name: "Alpha Doki",
            description: "Line one\nLine two",
            tags: ["cute", "idol"],
            alts: ["d2"],
            images: {
                Headshot: [
                    {
                        image_id: "img1",
                        image_ext: ".png",
                        image_name: "Alpha",
                        source: "@artist",
                        image_type: "Headshot",
                        urlOrig: `${cdn}/img1.png`,
                        urlWebp: `${cdn}/img1_p.webp`,
                        urlThumb: `${cdn}/img1_t.webp`,
                    },
                ],
            },
        });
        expect(data[1]).toMatchObject({ doki_id: "d2", tags: [], alts: [], images: {} });
    });

    it("resolves to an empty list for header-only CSVs", async () => {
        mockFetch({ "data.csv": `${DATA_HEADER}\n`, "images.csv": `${IMAGES_HEADER}\n` });
        await expect(loadDokiData()).resolves.toEqual([]);
    });

    it("rejects when data.csv can't be fetched", async () => {
        mockFetch({ "images.csv": `${IMAGES_HEADER}\n` });
        await expect(loadDokiData()).rejects.toThrow(`Failed to fetch ${cdn}/data.csv`);
    });

    it("rejects when images.csv can't be fetched", async () => {
        mockFetch({ "data.csv": `${DATA_HEADER}\n` });
        await expect(loadDokiData()).rejects.toThrow(`Failed to fetch ${cdn}/images.csv`);
    });

    it("rejects on a network error", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
        await expect(loadDokiData()).rejects.toThrow("Failed to fetch");
    });
});
