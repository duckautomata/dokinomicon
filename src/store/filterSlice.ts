import { FilterSlice, AppSliceCreator } from "./types";

export const createFilterSlice: AppSliceCreator<FilterSlice> = (set) => ({
    homeSearchText: "",
    homeSetSearchText: (text) => set({ homeSearchText: text }),
    homeFilterGroup: "All",
    homeSetFilterGroup: (group) => set({ homeFilterGroup: group }),
    imageSearchText: "",
    setImageSearchText: (text) => set({ imageSearchText: text }),
    imageFilterType: "All",
    setImageFilterType: (type) => set({ imageFilterType: type }),
});
