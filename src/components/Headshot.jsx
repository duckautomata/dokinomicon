import { Link } from "react-router-dom";


/**
 * @typedef {import("../store/types").DokiData} DokiData
 * @typedef {import("../store/types").ImageData} ImageData
 */

/**
 * Headshot component for displaying a Doki card.
 *
 * @param {Object} props
 * @param {DokiData} props.doki
 * @param {ImageData} props.headshot
 */
export default function Headshot({ doki, headshot }) {
    return (
        <Link to={`/view/${doki.doki_id}`} className="doki-card glass-panel">
            <div className="doki-card-image-container">
                {headshot ? (
                    <>
                        <img
                            src={headshot.urlWebp}
                            alt={doki.name}
                            className="doki-card-image"
                            loading="lazy"
                            onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "none"; // hide video indicator too on error
                                e.target.parentElement.querySelector(".doki-card-placeholder").style.display = "flex";
                            }}
                        />
                        {headshot.image_ext === ".mp4" && <div className="video-indicator"></div>}
                        <div className="doki-card-placeholder" style={{ display: "none" }}>
                            <span className="placeholder-text">{doki.name.charAt(0)}</span>
                        </div>
                    </>
                ) : (
                    <div className="doki-card-placeholder">
                        <span className="placeholder-text">{doki.name.charAt(0)}</span>
                    </div>
                )}
            </div>
            <div className="doki-card-content">
                <h3 className="doki-name">{doki.name}</h3>
                {doki.artists && <p className="doki-meta">Artist: {doki.artists}</p>}
                {doki.debut_date && <p className="doki-meta">Debut: {doki.debut_date}</p>}
                {doki.group && <p className="doki-meta">Group: {doki.group}</p>}
            </div>
        </Link>
    );
}
