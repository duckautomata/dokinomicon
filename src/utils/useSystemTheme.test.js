import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSystemTheme } from "./useSystemTheme";

describe("useSystemTheme", () => {
    let mediaQuery;
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
        mediaQuery = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
        window.matchMedia = vi.fn(() => mediaQuery);
        document.documentElement.removeAttribute("data-theme");
        localStorage.clear();
    });

    afterEach(() => {
        window.matchMedia = originalMatchMedia;
    });

    it("applies the system theme to <html>", () => {
        renderHook(() => useSystemTheme());
        expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
        expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    });

    it("applies light when the system prefers light", () => {
        mediaQuery.matches = false;
        renderHook(() => useSystemTheme());
        expect(document.documentElement).toHaveAttribute("data-theme", "light");
    });

    it("follows system theme changes and stops on unmount", () => {
        const { unmount } = renderHook(() => useSystemTheme());
        const [, handleChange] = mediaQuery.addEventListener.mock.calls[0];

        mediaQuery.matches = false;
        handleChange();
        expect(document.documentElement).toHaveAttribute("data-theme", "light");

        unmount();
        expect(mediaQuery.removeEventListener).toHaveBeenCalledWith("change", handleChange);
    });

    it("ignores the transcript site's saved theme", () => {
        localStorage.setItem("live-transcript-settings", JSON.stringify({ state: { theme: "light" }, version: 0 }));
        renderHook(() => useSystemTheme());
        expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    });
});
