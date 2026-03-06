import { useState, useMemo } from "react";
import ImageModal from "../components/ImageModal";
import { useAppStore } from "../store/store";
import "./Images.css";

export default function Images({ data }) {
    const searchQuery = useAppStore((state) => state.imageSearchText);
    const setSearchQuery = useAppStore((state) => state.setImageSearchText);
    const filterType = useAppStore((state) => state.imageFilterType);
    const setFilterType = useAppStore((state) => state.setImageFilterType);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    // Flatten all images into a single array
    const allImages = useMemo(() => {
        const imagesList = [];
        data.forEach((doki) => {
            if (doki.images) {
                Object.keys(doki.images).forEach((imageType) => {
                    doki.images[imageType].forEach((img) => {
                        imagesList.push({
                            ...img,
                            doki_id: doki.doki_id,
                            doki_name: doki.name,
                        });
                    });
                });
            }
        });
        return imagesList;
    }, [data]);

    // Get unique image types for the filter dropdown
    const imageTypes = useMemo(() => {
        const types = new Set();
        allImages.forEach((img) => types.add(img.image_type));
        return ["All", ...Array.from(types).sort()];
    }, [allImages]);

    // Filter images based on search query and type
    const filteredImages = useMemo(() => {
        return allImages.filter((img) => {
            const matchesType = filterType === "All" || img.image_type === filterType;

            if (!matchesType) return false;
            if (!searchQuery) return true;

            const query = searchQuery.toLowerCase();
            return (
                img.image_name?.toLowerCase().includes(query) ||
                img.doki_name?.toLowerCase().includes(query) ||
                img.image_type?.toLowerCase().includes(query)
            );
        });
    }, [allImages, filterType, searchQuery]);

    return (
        <div className="images-container">
            <header className="images-header">
                <div className="images-controls">
                    <div className="images-search-container">
                        <input
                            type="text"
                            className="images-search-input"
                            placeholder="Search by image, character, or type..."
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
                    <div className="images-filter-container">
                        <select
                            className="images-filter-select"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            {imageTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <div className="images-grid">
                {filteredImages.map((img, idx) => (
                    <div
                        key={`${img.doki_id}-${img.image_id}-${idx}`}
                        className="image-card glass-panel"
                        onClick={() => setSelectedImageIndex(idx)}
                    >
                        <div className="image-card-img-container">
                            <img
                                src={img.urlWebp}
                                alt={img.image_name || img.doki_name}
                                className="image-card-img"
                                loading="lazy"
                            />
                            {img.image_ext === ".mp4" && <div className="video-indicator"></div>}
                            {/* <div className="image-card-type-badge">{img.image_type}</div> */}
                        </div>
                        <div className="image-card-content">
                            <h3 className="image-title">{img.image_name || "Untitled"}</h3>
                            <p className="image-doki-name">{img.doki_name}</p>
                            <p className="image-doki-name">{img.image_type}</p>
                        </div>
                    </div>
                ))}
            </div>

            {filteredImages.length === 0 && (
                <div className="images-empty-state">
                    <p>No images found matching your search.</p>
                </div>
            )}

            {selectedImageIndex !== null && (
                <ImageModal
                    images={filteredImages}
                    selectedIndex={selectedImageIndex}
                    onClose={() => setSelectedImageIndex(null)}
                    onNavigate={setSelectedImageIndex}
                />
            )}
        </div>
    );
}
