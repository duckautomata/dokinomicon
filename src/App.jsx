import { useEffect, useState } from "react";
import { Routes, Route, Link, NavLink } from "react-router-dom";
import { loadDokiData } from "./utils/dataLoader";
import { useAppStore } from "./store/store";
import Home from "./pages/Home";
import View from "./pages/View";
import UpdateAlert from "./components/UpdateAlert";
import Images from "./pages/Images";
import ScrollToTop from "./components/ScrollToTop";
import "./App.css";

export default function App() {
    const [data, setData] = useState([]);
    const theme = useAppStore((state) => state.theme);

    useEffect(() => {
        loadDokiData().then(setData);
    }, []);

    // Apply theme to document
    useEffect(() => {
        const applyTheme = (currentTheme) => {
            if (currentTheme === "system") {
                const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                document.documentElement.setAttribute("data-theme", systemPrefersDark ? "dark" : "light");
            } else {
                document.documentElement.setAttribute("data-theme", currentTheme);
            }
        };

        applyTheme(theme);

        // Listen for system theme changes if set to system
        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handleChange = () => applyTheme("system");

            // Modern API
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener("change", handleChange);
                return () => mediaQuery.removeEventListener("change", handleChange);
            } else if (mediaQuery.addListener) {
                // Older API fallback
                mediaQuery.addListener(handleChange);
                return () => mediaQuery.removeListener(handleChange);
            }
        }
    }, [theme]);

    if (!data.length)
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontSize: "1.2rem",
                    color: "var(--text-secondary)",
                }}
            >
                Loading Dokinomicon...
            </div>
        );

    return (
        <>
            <UpdateAlert />
            <header className="top-nav">
                <Link to="/" className="nav-brand">
                    Dokinomicon
                </Link>
                <nav className="nav-links">
                    <div className="nav-main-links">
                        <NavLink to="/" className="nav-link nav-home">
                            Home
                        </NavLink>
                        <NavLink to="/image" className="nav-link nav-images">
                            Images
                        </NavLink>
                    </div>
                    <ScrollToTop />
                </nav>
            </header>
            <main className="content">
                <Routes>
                    <Route path="/" element={<Home data={data} />} />
                    <Route path="/image" element={<Images data={data} />} />
                    <Route path="/view/:doki_id" element={<View data={data} />} />
                </Routes>
            </main>
        </>
    );
}
