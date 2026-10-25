import { FilterSlice, AppSliceCreator } from "./types";

export const createFilterSlice: AppSliceCreator<FilterSlice> = (set) => ({
    homeSearchText: "",
    homeSetSearchText: (text) => set({ homeSearchText: text }),
    homeFilterGroup: "All",
    homeSetFilterGroup: (group) => set({ homeFilterGroup: group }),
    homeSortBy: "default",
    // Picking "Random" re-rolls the seed, so coming back to it gives a fresh shuffle. Every other
    // path leaves the seed alone, which keeps the order steady while the user browses and returns.
    homeSetSortBy: (sortBy) =>
        set(sortBy === "random" ? { homeSortBy: sortBy, homeRandomSeed: Math.random() } : { homeSortBy: sortBy }),
    homeRandomSeed: Math.random(),
    imageSearchText: "",
    setImageSearchText: (text) => set({ imageSearchText: text }),
    imageFilterType: "All",
    setImageFilterType: (type) => set({ imageFilterType: type }),
});
