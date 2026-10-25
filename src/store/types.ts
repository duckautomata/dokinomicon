import { StateCreator } from "zustand";

// Data Structure Interfaces

export interface ImageData {
    image_id: string;
    image_ext: string;
    image_name: string;
    source: string;
    image_type: string;
    urlOrig: string;
    urlWebp: string;
    urlThumb: string;
}

export interface DokiData {
    doki_id: string;
    name: string;
    debut_date: string;
    debut_stream: string;
    artists: string;
    description: string;
    group: string;
    parent_id: string;
    tags: string[];
    images: {
        Headshot: ImageData[];
        Reference: ImageData[];
        Screenshot: ImageData[];
        Asset: ImageData[];
    };
}

// Slice Interfaces

export interface FilterSlice {
    homeSearchText: string;
    homeSetSearchText: (text: string) => void;
    homeFilterGroup: string;
    homeSetFilterGroup: (group: string) => void;
    homeSortBy: string;
    homeSetSortBy: (sortBy: string) => void;
    homeRandomSeed: number;
    imageSearchText: string;
    setImageSearchText: (text: string) => void;
    imageFilterType: string;
    setImageFilterType: (type: string) => void;
}

export interface ScrollSlice {
    homeScrollY: number;
    homeSetScrollY: (y: number) => void;
    pendingScrollY: number;
    restoreHomeScroll: () => void;
    takePendingScrollY: () => number;
}

// The combined store type
export type AppStore = FilterSlice & ScrollSlice;

// Helper type for creating slices
export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
