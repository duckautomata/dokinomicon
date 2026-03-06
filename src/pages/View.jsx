import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ImageModal from "../components/ImageModal";
import { renderTextWithLinks } from "../utils/textUtils";
import "./View.css";

export default function View({ data }) {
    const { doki_id } = useParams();
    const doki = data.find((d) => d.doki_id === doki_id);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    // Compute a flat array of all images in the order they appear on the page
    const viewableImages = useMemo(() => {
        if (!doki) return [];

        const headshots = doki.images?.Headshot || [];
        const references = doki.images?.Reference || [];
        const screenshots = doki.images?.Screenshot || [];
        const assets = doki.images?.Asset || [];

        const images = [];

        // 1. Hero image (first headshot)
        if (headshots.length > 0) {
            images.push(headshots[0]);
        }

        // 2. Reference images
        images.push(...references);

        // 3. Screenshot images
        images.push(...screenshots);

        // 4. Asset images
        images.push(...assets);

        // 5. Other Headshots
        if (headshots.length > 1) {
            images.push(...headshots.slice(1));
        }

        return images;
    }, [doki]);

    if (!doki)
        return (
            <div className="view-not-found">
                <h2>Doki not found</h2>
                <Link to="/" className="back-link">
                    Return Home
                </Link>
            </div>
        );

    const headshots = doki.images?.Headshot || [];
    const mainImage = headshots.length > 0 ? headshots[0] : null;

    const handleImageClick = (img) => {
        // Find index in the flat array based on URL
        const index = viewableImages.findIndex((vImg) => vImg.urlWebp === img.urlWebp);
        if (index !== -1) {
            setSelectedImageIndex(index);
        }
    };

    const renderImageGroup = (title, imageList) => {
        if (!imageList || imageList.length === 0) return null;

        return (
            <div className="view-section gallery-section" key={title}>
                <h2 className="section-title">{title}</h2>
                <div className="gallery-grid">
                    {imageList.map((img, idx) => (
                        <div
                            key={idx}
                            className="gallery-item glass-panel"
                            onClick={() => handleImageClick(img)}
                            style={{ position: "relative" }}
                        >
                            <img
                                src={img.urlWebp}
                                alt={`${doki.name} ${title} ${idx + 1}`}
                                className="gallery-image"
                                loading="lazy"
                            />
                            {img.image_ext === ".mp4" && <div className="video-indicator"></div>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="view-container">
            <Link to="/" className="back-link">
                <span className="back-arrow">←</span> Back to Gallery
            </Link>

            <div className="view-hero glass-panel">
                {mainImage && (
                    <div
                        className="hero-image-wrapper"
                        style={{ cursor: "zoom-in", position: "relative" }}
                        onClick={() => handleImageClick(mainImage)}
                    >
                        <img src={mainImage.urlWebp} alt={doki.name} className="hero-image" />
                        {mainImage.image_ext === ".mp4" && <div className="video-indicator"></div>}
                        <div className="hero-image-overlay"></div>
                    </div>
                )}
                <div className="hero-content">
                    <h1 className="hero-title">{doki.name}</h1>
                    {doki.artists && (
                        <p className="hero-artist">
                            Created by <span>{renderTextWithLinks(doki.artists)}</span>
                        </p>
                    )}

                    <div className="hero-meta">
                        {doki.debut_date && (
                            <div className="meta-item">
                                <span className="meta-label">Debut Date</span>
                                <span className="meta-value">{doki.debut_date}</span>
                            </div>
                        )}
                        {doki.debut_stream && (
                            <div className="meta-item">
                                <span className="meta-label">Debut Stream</span>
                                <a
                                    href={doki.debut_stream}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="meta-value link"
                                >
                                    Watch VOD
                                </a>
                            </div>
                        )}
                        {doki.group && (
                            <div className="meta-item">
                                <span className="meta-label">Group</span>
                                <span className="meta-value">{doki.group}</span>
                            </div>
                        )}
                    </div>

                    <div className="hero-description">
                        {doki.description.split("\n").map((paragraph, idx) => (
                            <p key={idx}>{renderTextWithLinks(paragraph)}</p>
                        ))}
                    </div>

                    {doki.tags && doki.tags.length > 0 && (
                        <div className="hero-tags">
                            {doki.tags.map((tag) => (
                                <span key={tag} className="tag-pill">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {renderImageGroup("Reference", doki.images?.Reference)}
            {renderImageGroup("Screenshot", doki.images?.Screenshot)}
            {renderImageGroup("Asset", doki.images?.Asset)}
            {renderImageGroup("Other Headshots", doki.images?.Headshot?.slice(1))}

            {selectedImageIndex !== null && (
                <ImageModal
                    images={viewableImages}
                    selectedIndex={selectedImageIndex}
                    onClose={() => setSelectedImageIndex(null)}
                    onNavigate={setSelectedImageIndex}
                />
            )}
        </div>
    );
}
