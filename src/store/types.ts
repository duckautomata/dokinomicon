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
    imageSearchText: string;
    setImageSearchText: (text: string) => void;
    imageFilterType: string;
    setImageFilterType: (type: string) => void;
}

export interface SettingsSlice {
    theme: "light" | "system" | "dark";
    density: "compact" | "standard" | "comfortable";
    timeFormat: "relative" | "local" | "UTC";
    transcriptHeight: "100%" | "90%" | "75%" | "50%";
    enableTagHelper: boolean;
    defaultOffset: number;
    sidebarOpen: boolean;
    devMode: boolean;
    membershipKey: string;
    membershipInfo: { channel: string; expiresAt: string } | null;
    useVirtualList: boolean;
    setTheme: (theme: SettingsSlice["theme"]) => void;
    setDensity: (density: SettingsSlice["density"]) => void;
    setTimeFormat: (format: SettingsSlice["timeFormat"]) => void;
    setTranscriptHeight: (height: SettingsSlice["transcriptHeight"]) => void;
    setEnableTagHelper: (value: boolean) => void;
    setDefaultOffset: (offset: number) => void;
    setSidebarOpen: (isOpen: boolean) => void;
    setDevMode: (value: boolean) => void;
    setMembershipKey: (key: string) => void;
    setMembershipInfo: (info: SettingsSlice["membershipInfo"]) => void;
    setUseVirtualList: (value: boolean) => void;
}

// The combined store type
export type AppStore = FilterSlice & SettingsSlice;

// Helper type for creating slices
export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
