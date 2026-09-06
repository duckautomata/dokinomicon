import { FilterSlice, AppSliceCreator } from "./types";

export const createFilterSlice: AppSliceCreator<FilterSlice> = (set) => ({
    homeSearchText: "",
    homeSetSearchText: (text) => set({ homeSearchText: text }),
    homeFilterGroup: "All",
    homeSetFilterGroup: (group) => set({ homeFilterGroup: group }),
    homeSortBy: "default",
    homeSetSortBy: (sortBy) => set({ homeSortBy: sortBy }),
    imageSearchText: "",
    setImageSearchText: (text) => set({ imageSearchText: text }),
    imageFilterType: "All",
    setImageFilterType: (type) => set({ imageFilterType: type }),
});
