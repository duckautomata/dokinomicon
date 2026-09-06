import { useMemo } from "react";
import Headshot from "../components/Headshot";
import { useAppStore } from "../store/store";
import "./Home.css";

/**
 * @typedef {import("../store/types").DokiData} DokiData
 */

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** debut_date is "YYYY-MM-DD", which already sorts chronologically as a plain string. */
const compareIso = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Builds a comparator over a text key. Dokis with a missing value always sink to the bottom,
 * in both directions, so "Debut (oldest)" does not open with the undated ones. Equal keys
 * return 0, so the stable sort falls back to the original csv order.
 */
const byText =
    (keyOf, dir, compare = collator.compare) =>
    (a, b) => {
        const ka = keyOf(a);
        const kb = keyOf(b);
        if (!ka && !kb) return 0;
        if (!ka) return 1;
        if (!kb) return -1;
        return dir * compare(ka, kb);
    };

const imageCount = (doki) => Object.values(doki.images || {}).reduce((total, list) => total + (list?.length || 0), 0);

/**
 * Artists are stored as handles ("@_klaeia & @__tofu__"). "@" and "_" sort below "A", which would
 * bunch those handles at the front, so they are dropped from the sort key only - the card still
 * shows the handle as written.
 */
const artistKey = (doki) => (doki.artists || "").replace(/[@_]/g, "").trim();

/** "Default" has no comparator, which keeps the order the csv file was authored in. */
const SORT_OPTIONS = [
    { value: "default", label: "Default" },
    { value: "name-asc", label: "Name (A-Z)", comparator: byText((doki) => doki.name, 1) },
    { value: "name-desc", label: "Name (Z-A)", comparator: byText((doki) => doki.name, -1) },
    { value: "debut-desc", label: "Debut (newest)", comparator: byText((doki) => doki.debut_date, -1, compareIso) },
    { value: "debut-asc", label: "Debut (oldest)", comparator: byText((doki) => doki.debut_date, 1, compareIso) },
    { value: "artist-asc", label: "Artist (A-Z)", comparator: byText(artistKey, 1) },
    { value: "group-asc", label: "Group (A-Z)", comparator: byText((doki) => doki.group, 1) },
    // Raw subtraction on purpose: 0 images is a real count, not a missing value.
    { value: "images-desc", label: "Most images", comparator: (a, b) => imageCount(b) - imageCount(a) },
];

/**
 * @param {Object} props
 * @param {DokiData[]} props.data
 */
export default function Home({ data }) {
    const searchQuery = useAppStore((state) => state.homeSearchText);
    const setSearchQuery = useAppStore((state) => state.homeSetSearchText);
    const filterGroup = useAppStore((state) => state.homeFilterGroup);
    const setFilterGroup = useAppStore((state) => state.homeSetFilterGroup);
    const sortBy = useAppStore((state) => state.homeSortBy);
    const setSortBy = useAppStore((state) => state.homeSetSortBy);

    const groups = useMemo(() => {
        const uniqueGroups = new Set();
        data.forEach((doki) => {
            if (doki.group) uniqueGroups.add(doki.group);
        });
        return ["All", ...Array.from(uniqueGroups).sort()];
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter((doki) => {
            const matchesGroup = filterGroup === "All" || doki.group === filterGroup;
            if (!matchesGroup) return false;

            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                doki.name.toLowerCase().includes(query) ||
                (doki.tags && doki.tags.some((tag) => tag.toLowerCase().includes(query)))
            );
        });
    }, [data, filterGroup, searchQuery]);

    const sortedData = useMemo(() => {
        const option = SORT_OPTIONS.find((opt) => opt.value === sortBy);
        if (!option?.comparator) return filteredData;
        // Copy before sorting: `data` is App state shared with every other route, and
        // `filteredData` is memoized, so sorting either in place would corrupt them.
        return [...filteredData].sort(option.comparator);
    }, [filteredData, sortBy]);

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
                        <div className="filter-group">
                            <label htmlFor="group-filter" className="filter-label">
                                Group
                            </label>
                            <select
                                id="group-filter"
                                className="filter-select"
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
                        <div className="filter-group">
                            <label htmlFor="sort-filter" className="filter-label">
                                Sort
                            </label>
                            <select
                                id="sort-filter"
                                className="filter-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <div className="doki-grid">
                {sortedData.flatMap((doki) => {
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
