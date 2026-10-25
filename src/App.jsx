import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { loadDokiData } from "./utils/dataLoader";
import { useAppStore } from "./store/store";
import { useSystemTheme } from "./utils/useSystemTheme";
import { sites } from "../sites.config.js";
import { site } from "./site";
import { hubUrl } from "./config";
import UpdateAlert from "./components/UpdateAlert";
import DataLoadError from "./components/DataLoadError";
import EnvironmentBadge from "./components/EnvironmentBadge";
import MockApiBadge from "./components/MockApiBadge";
import ScrollToTop from "./components/ScrollToTop";
import SuggestionsDropdown from "./components/SuggestionsDropdown";
import SiteMenu from "./components/SiteMenu";
import "./App.css";

// Every site in config order, so the rows stay put when switching sites. Paths are
// built at runtime: a literal "/<slug>/" would fail the build's check for another site's base.
const menuSites = Object.values(sites).map((s) => ({
    id: s.id,
    title: s.shortTitle,
    subtitle: s.name,
    href: `/${s.slug}/`,
    iconSrc: `/${s.slug}/favicon-32x32.png`,
    iconSrcSet: `/${s.slug}/favicon-32x32.png 1x, /${s.slug}/android-chrome-192x192.png 2x`,
    current: s.id === site.id,
}));

export default function App() {
    const location = useLocation();
    const takePendingScrollY = useAppStore((state) => state.takePendingScrollY);

    useLayoutEffect(() => {
        document.documentElement.style.scrollBehavior = "auto";

        // A route opens at the top unless the navigation asked to land somewhere - "Back to
        // Gallery" hands back the offset the grid was left at. The restore belongs here rather
        // than in the page itself: child effects run first, so this one would scroll the page
        // straight back to the top afterwards.
        window.scrollTo({
            top: takePendingScrollY(),
            left: 0,
            behavior: "instant",
        });

        // Cleared on the way out: a navigation that unmounts the app, as every test does, would
        // otherwise leave this reaching for a document that is no longer there.
        const restoreScrollBehavior = setTimeout(() => {
            document.documentElement.style.scrollBehavior = "";
        }, 20);
        return () => clearTimeout(restoreScrollBehavior);
    }, [location.pathname, takePendingScrollY]);

    useSystemTheme();

    // null until the csv files have loaded. An empty array is a loaded site with no dokis yet.
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [loadAttempt, setLoadAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        loadDokiData()
            .then((rows) => {
                if (!cancelled) setData(rows);
            })
            .catch((error) => {
                if (!cancelled) setLoadError(error);
            });
        return () => {
            cancelled = true;
        };
    }, [loadAttempt]);

    const retryLoad = () => {
        setLoadError(null);
        setLoadAttempt((attempt) => attempt + 1);
    };

    if (loadError) return <DataLoadError error={loadError} onRetry={retryLoad} />;

    if (!data)
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
                {`Loading ${site.shortTitle}...`}
            </div>
        );

    return (
        <>
            <UpdateAlert />
            <header className="top-nav">
                <div className="brand-group">
                    <SiteMenu title={site.shortTitle} sites={menuSites} hubUrl={hubUrl} />
                    <EnvironmentBadge className="desktop-only" />
                    <MockApiBadge className="desktop-only" />
                </div>
                <nav className="nav-links">
                    <div className="nav-main-links">
                        <NavLink to="/" end className="nav-link nav-home">
                            Home
                        </NavLink>
                        <NavLink to="/image" className="nav-link nav-images">
                            Images
                        </NavLink>
                        <EnvironmentBadge className="mobile-only" />
                        <MockApiBadge className="mobile-only" />
                        <SuggestionsDropdown />
                    </div>
                    <ScrollToTop />
                </nav>
            </header>
            <main className="content">
                <Outlet context={{ data }} />
            </main>
        </>
    );
}
