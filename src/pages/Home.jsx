import { useMemo } from "react";
import Headshot from "../components/Headshot";
import { useAppStore } from "../store/store";
import "./Home.css";

/**
 * @typedef {import("../store/types").DokiData} DokiData
 */

/**
 * @param {Object} props
 * @param {DokiData[]} props.data
 */
export default function Home({ data }) {
    const searchQuery = useAppStore((state) => state.homeSearchText);
    const setSearchQuery = useAppStore((state) => state.homeSetSearchText);
    const filterGroup = useAppStore((state) => state.homeFilterGroup);
    const setFilterGroup = useAppStore((state) => state.homeSetFilterGroup);

    const groups = useMemo(() => {
        const uniqueGroups = new Set();
        data.forEach((doki) => {
            if (doki.group) uniqueGroups.add(doki.group);
        });
        return ["All", ...Array.from(uniqueGroups).sort()];
    }, [data]);

    const filteredData = data.filter((doki) => {
        const matchesGroup = filterGroup === "All" || doki.group === filterGroup;
        if (!matchesGroup) return false;

        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            doki.name.toLowerCase().includes(query) ||
            (doki.tags && doki.tags.some((tag) => tag.toLowerCase().includes(query)))
        );
    });

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="home-controls">
                    <div className="home-search-container">
                        <input
                            type="text"
                            className="home-search-input"
                            placeholder="Search by name or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="search-clear-button"
                                onClick={() => setSearchQuery("")}
                                aria-label="Clear search"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="home-filter-container">
                        <select
                            className="home-filter-select"
                            value={filterGroup}
                            onChange={(e) => setFilterGroup(e.target.value)}
                        >
                            {groups.map((group) => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <div className="doki-grid">
                {filteredData.flatMap((doki) => {
                    const headshots = doki.images?.Headshot || [];

                    if (headshots.length === 0) {
                        return [<Headshot key={`${doki.doki_id}-no-img`} doki={doki} />];
                    }

                    return headshots.map((headshot, idx) => (
                        <Headshot key={`${doki.doki_id}-img-${idx}`} doki={doki} headshot={headshot} />
                    ));
                })}
            </div>
        </div>
    );
}
