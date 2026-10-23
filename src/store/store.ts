import { create } from "zustand";

import { AppStore } from "./types";
import { createFilterSlice } from "./filterSlice";

// In-memory only. Nothing here is persisted to localStorage.
export const useAppStore = create<AppStore>()((set, get, api) => ({
    ...createFilterSlice(set, get, api),
}));
