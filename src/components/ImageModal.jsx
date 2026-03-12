import { useEffect, useState, useCallback } from "react";
import "./ImageModal.css";
import { LOG_ERROR } from "../utils/debug";

/**
 * @typedef {import("../store/types").ImageData} ImageData
 */

/**
 * ImageModal component for viewing images in a modal gallery.
 *
 * @param {Object} props
 * @param {ImageData[]} props.images
 * @param {number} props.selectedIndex
 * @param {function(): void} props.onClose
 * @param {function(number): void} props.onNavigate
 */
export default function ImageModal({ images, selectedIndex, onClose, onNavigate }) {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedImage, setCopiedImage] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [lastSelectedIndex, setLastSelectedIndex] = useState(selectedIndex);
    const image = images[selectedIndex];

    if (selectedIndex !== lastSelectedIndex) {
        setLastSelectedIndex(selectedIndex);
        setCopiedLink(false);
        setCopiedImage(false);
        setErrorMsg("");
    }

    const handleBackgroundClick = (e) => {
        if (
            e.target.classList.contains("modal-overlay") ||
            e.target.classList.contains("modal-content") ||
            e.target.classList.contains("modal-image-container")
        ) {
            onClose();
        }
    };

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowRight") {
                if (selectedIndex < images.length - 1) onNavigate(selectedIndex + 1);
            } else if (e.key === "ArrowLeft") {
                if (selectedIndex > 0) onNavigate(selectedIndex - 1);
            }
        },
        [selectedIndex, images.length, onClose, onNavigate],
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        // Prevent scrolling on body when modal is open
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [handleKeyDown]);

    if (!image) return null;

    const handleCopyLink = async () => {
        try {
            const copyUrl = image.image_ext === ".mp4" ? image.urlOrig : image.urlWebp;
            await navigator.clipboard.writeText(copyUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (err) {
            LOG_ERROR("Failed to copy link:", err);
        }
    };

    const handleCopyImage = async () => {
        try {
            // Check if standard clipboard API supports this
            if (!navigator.clipboard || !window.ClipboardItem) {
                setErrorMsg("Copying images is not supported in your browser.");
                setTimeout(() => setErrorMsg(""), 3000);
                return;
            }

            const response = await fetch(image.urlOrig);
            const blob = await response.blob();
            // Create a new clipboard item with the blob type
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 2000);
        } catch (err) {
            LOG_ERROR("Failed to copy image:", err);
            setErrorMsg(
                "Failed to copy image. Your browser might block cross-origin copying, or the image format might not be supported.",
            );
            setTimeout(() => setErrorMsg(""), 3000);
        }
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        const fileName = `${image.image_name}${image.image_ext}`;
        link.href = `${image.urlOrig}?download=true&name=${encodeURIComponent(fileName)}`;
        // Suggest a filename
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="modal-overlay" onClick={handleBackgroundClick}>
            {errorMsg && <div className="modal-error-popup">{errorMsg}</div>}
            <div className="modal-content">
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    ×
                </button>

                <div className="modal-image-container">
                    {image.image_ext === ".mp4" ? (
                        <video src={image.urlOrig} className="modal-image checkerboard-bg" controls autoPlay loop />
                    ) : (
                        <img
                            src={image.urlWebp}
                            alt={image.image_name || "Gallery image"}
                            className="modal-image checkerboard-bg"
                        />
                    )}

                    {selectedIndex > 0 && (
                        <button
                            className="modal-nav prev"
                            onClick={() => onNavigate(selectedIndex - 1)}
                            aria-label="Previous Image"
                        >
                            ‹
                        </button>
                    )}

                    {selectedIndex < images.length - 1 && (
                        <button
                            className="modal-nav next"
                            onClick={() => onNavigate(selectedIndex + 1)}
                            aria-label="Next Image"
                        >
                            ›
                        </button>
                    )}
                </div>

                <div className="modal-info-bar">
                    <div className="modal-details">
                        <h3 className="modal-title">{image.image_name || "Untitled"}</h3>
                        <div className="modal-meta">
                            {image.image_type && <span className="modal-tag type-tag">{image.image_type}</span>}
                            {image.source && (
                                <a
                                    href={image.source}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="modal-tag source-tag"
                                    style={{ textDecoration: "none" }}
                                >
                                    <span style={{ marginRight: "4px" }}>🔗</span>
                                    Source
                                </a>
                            )}
                            <span className="modal-tag id-tag">ID: {image.image_id}</span>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="modal-action-btn" onClick={handleCopyLink} title="Copy Link">
                            <span className="icon">🔗</span>
                            {copiedLink ? "Copied Link!" : "Copy Link"}
                        </button>
                        {image.image_ext !== ".gif" && image.image_ext !== ".mp4" && (
                            <button
                                className="modal-action-btn"
                                onClick={handleCopyImage}
                                title="Copy Original Image Data"
                            >
                                <span className="icon">📋</span>
                                {copiedImage ? "Copied Image!" : "Copy Image"}
                            </button>
                        )}
                        <button className="modal-action-btn primary" onClick={handleDownload} title="Download Original">
                            <span className="icon">⬇️</span>
                            Download Original
                        </button>
                    </div>
                </div>
            </div>
            <div className="modal-counter">
                {selectedIndex + 1} / {images.length}
            </div>
        </div>
    );
}
