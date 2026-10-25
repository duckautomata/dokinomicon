import { ScrollSlice, AppSliceCreator } from "./types";

/**
 * Scroll memory for the gallery. The grid is a long page, so returning from a doki's view page
 * should land where the user left off rather than at the top - the same place the browser's own
 * back button puts them.
 */
export const createScrollSlice: AppSliceCreator<ScrollSlice> = (set, get) => ({
    // Where the grid stood when the user last opened a card. Recorded on the click, not on
    // unmount: by then the short view page has already replaced the grid and the browser has
    // clamped the offset to the new, much smaller document.
    homeScrollY: 0,
    homeSetScrollY: (y) => set({ homeScrollY: y }),
    // The offset the next navigation should land on. 0 is the top, which is where every
    // navigation that has not asked for a restore belongs.
    pendingScrollY: 0,
    restoreHomeScroll: () => set({ pendingScrollY: get().homeScrollY }),
    takePendingScrollY: () => {
        const pending = get().pendingScrollY;
        if (pending) set({ pendingScrollY: 0 });
        return pending;
    },
});
