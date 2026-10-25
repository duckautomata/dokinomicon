import { useEffect } from "react";

/**
 * Applies data-theme="dark|light" to <html> from the system's
 * prefers-color-scheme and follows it when it changes. Nothing is stored.
 */
export function useSystemTheme() {
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const applyTheme = () => {
            document.documentElement.setAttribute("data-theme", mediaQuery.matches ? "dark" : "light");
        };

        applyTheme();

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", applyTheme);
            return () => mediaQuery.removeEventListener("change", applyTheme);
        } else if (mediaQuery.addListener) {
            // Older API fallback
            mediaQuery.addListener(applyTheme);
            return () => mediaQuery.removeListener(applyTheme);
        }
    }, []);
}
