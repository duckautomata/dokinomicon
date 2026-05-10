import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TurnstileWidget from "../components/TurnstileWidget";
import ImageDropZone from "../components/ImageDropZone";
import UnsavedChangesGuard from "../components/UnsavedChangesGuard";
import { fetchPublicConfig, uploadImage, submitSuggestion, validateImageFile } from "../utils/contentApi";
import { LOG_ERROR } from "../utils/debug";
import "./SuggestionForms.css";

/**
 * @typedef {import("../store/types").DokiData} DokiData
 */

const IMAGE_TYPES = ["Headshot", "Reference", "Screenshot", "Asset"];

/**
 * @param {Object} props
 * @param {DokiData[]} [props.data]
 */
export default function AddDoki({ data = [] }) {
    const [cfg, setCfg] = useState(null);
    const [cfgError, setCfgError] = useState(null);

    const [name, setName] = useState("");
    const [artists, setArtists] = useState("");
    const [description, setDescription] = useState("");
    const [debutDate, setDebutDate] = useState("");
    const [debutStream, setDebutStream] = useState("");
    const [group, setGroup] = useState("");
    const [tagsText, setTagsText] = useState("");
    const [notes, setNotes] = useState("");

    // Newly uploaded images default to an empty type (so it's obvious the user
    // never specified one) and empty source; both are edited per-row in the
    // list below the dropzone.
    const [pickedQueue, setPickedQueue] = useState([]); // [{ file, image_type, source }]
    const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
    const [uploadedImages, setUploadedImages] = useState([]);

    const [turnstileToken, setTurnstileToken] = useState(null);
    const turnstileResetRef = useRef(null);
    const isUploadingRef = useRef(false);

    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const groupOptions = useMemo(() => {
        const set = new Set();
        (data ?? []).forEach((d) => {
            if (d.group) set.add(d.group);
        });
        return Array.from(set).sort();
    }, [data]);

    useEffect(() => {
        fetchPublicConfig()
            .then(setCfg)
            .catch((err) => {
                LOG_ERROR("Failed to fetch public config", err);
                setCfgError(err.message);
            });
    }, []);

    const headFile = pickedQueue[0]?.file;
    useEffect(() => {
        if (!headFile) {
            setLocalPreviewUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(headFile);
        setLocalPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [headFile]);

    useEffect(() => {
        if (pickedQueue.length === 0 || !turnstileToken || busy) return;
        if (isUploadingRef.current) return;
        isUploadingRef.current = true;

        const head = pickedQueue[0];
        const token = turnstileToken;
        setBusy("uploading");
        setError(null);

        (async () => {
            try {
                const result = await uploadImage({ token, file: head.file });
                setUploadedImages((prev) => [
                    ...prev,
                    {
                        ...result,
                        image_type: head.image_type,
                        source: head.source,
                        file_name: head.file.name,
                    },
                ]);
                setPickedQueue((prev) => prev.slice(1));
            } catch (err) {
                LOG_ERROR("Upload failed", err);
                setError(`Upload failed: ${err.message}`);
                setPickedQueue((prev) => prev.slice(1)); // skip the failed one
            } finally {
                isUploadingRef.current = false;
                setBusy(null);
                turnstileResetRef.current?.();
            }
        })();
    }, [pickedQueue, turnstileToken, busy]);

    const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    const canSubmit = name.trim().length > 0 && !!turnstileToken && !busy;
    const isDirty =
        !success &&
        (name.trim().length > 0 ||
            artists.trim().length > 0 ||
            description.trim().length > 0 ||
            debutDate.trim().length > 0 ||
            debutStream.trim().length > 0 ||
            group.trim().length > 0 ||
            tagsText.trim().length > 0 ||
            notes.trim().length > 0 ||
            pickedQueue.length > 0 ||
            uploadedImages.length > 0);

    const handleFileSelected = (file) => {
        setError(null);
        setSuccess(null);
        const validationError = validateImageFile(file, cfg);
        if (validationError) {
            setError(validationError);
            return;
        }
        setPickedQueue((prev) => [...prev, { file, image_type: "", source: "" }]);
    };

    const handleClearQueue = () => {
        if (busy) return;
        setPickedQueue([]);
        setError(null);
    };

    const handleRemoveUploaded = (id) => {
        if (busy) return;
        setUploadedImages((prev) => prev.filter((img) => img.id !== id));
    };

    const handleUploadedTypeChange = (id, newType) => {
        setUploadedImages((prev) => prev.map((img) => (img.id === id ? { ...img, image_type: newType } : img)));
    };

    const handleUploadedSourceChange = (id, newSource) => {
        setUploadedImages((prev) => prev.map((img) => (img.id === id ? { ...img, source: newSource } : img)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError(null);
        setBusy("submitting");
        try {
            const payload = {
                name: name.trim(),
                artists: artists.trim(),
                description: description.trim(),
                debut_date: debutDate.trim(),
                debut_stream: debutStream.trim(),
                group: group.trim(),
                tags,
                notes: notes.trim(),
                images: uploadedImages.map((img) => ({
                    image_id: img.id,
                    image_type: img.image_type,
                    source: img.source,
                    file_name: img.file_name,
                })),
            };
            const result = await submitSuggestion({
                token: turnstileToken,
                kind: "new",
                payload,
                imageIds: uploadedImages.map((img) => img.id),
            });
            setSuccess(result);
        } catch (err) {
            LOG_ERROR("Submit failed", err);
            setError(`Submission failed: ${err.message}`);
        } finally {
            setBusy(null);
            turnstileResetRef.current?.();
        }
    };

    if (cfgError) {
        return (
            <div className="suggestion-page">
                <Link to="/" className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Gallery
                </Link>
                <div className="suggestion-card glass-panel">
                    <div className="suggestion-status error">Failed to load suggestion config: {cfgError}</div>
                </div>
            </div>
        );
    }

    if (!cfg) {
        return (
            <div className="suggestion-page">
                <div className="suggestion-loading">Loading suggestion form…</div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="suggestion-page">
                <Link to="/" className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Gallery
                </Link>
                <div className="suggestion-card glass-panel">
                    <h1 className="suggestion-title">Thanks!</h1>
                    <p className="suggestion-subtitle">
                        Your doki suggestion has been submitted for review. Reference ID: <code>{success.id}</code>
                    </p>
                    <div className="suggestion-actions">
                        <Link to="/" className="suggestion-submit-btn" style={{ textDecoration: "none" }}>
                            Back to Gallery
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const maxMb = (cfg.max_image_bytes / (1024 * 1024)).toFixed(0);
    const acceptList = (cfg.supported_formats ?? []).map((f) => `.${f}`).join(",");

    let dropzoneOverlay = null;
    if (busy === "uploading") {
        dropzoneOverlay = pickedQueue.length > 1 ? `Uploading… (${pickedQueue.length} left)` : "Uploading…";
    } else if (pickedQueue.length > 0 && !turnstileToken) {
        dropzoneOverlay = "Waiting for verification…";
    }

    return (
        <div className="suggestion-page">
            <UnsavedChangesGuard when={isDirty} />
            <Link to="/" className="suggestion-back">
                <span className="back-arrow">←</span> Back to Gallery
            </Link>
            <div className="suggestion-card glass-panel">
                <h1 className="suggestion-title">Suggest a New Doki</h1>
                <p className="suggestion-subtitle">
                    Submit a new doki for review. An admin will check it before it gets added to the archive.
                </p>

                <form className="suggestion-form" onSubmit={handleSubmit}>
                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-name">
                            Name <span className="suggestion-field-required">*</span>
                        </label>
                        <input
                            id="add-name"
                            className="suggestion-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-artists">
                            Artists <span className="suggestion-field-hint">(creators, comma separated)</span>
                        </label>
                        <input
                            id="add-artists"
                            className="suggestion-input"
                            type="text"
                            value={artists}
                            onChange={(e) => setArtists(e.target.value)}
                            maxLength={500}
                        />
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-description">
                            Description
                        </label>
                        <textarea
                            id="add-description"
                            className="suggestion-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={5000}
                        />
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-debut-date">
                            Debut Date <span className="suggestion-field-hint">(YYYY-MM-DD)</span>
                        </label>
                        <input
                            id="add-debut-date"
                            className="suggestion-input"
                            type="text"
                            value={debutDate}
                            onChange={(e) => setDebutDate(e.target.value)}
                            placeholder="2024-05-01"
                            maxLength={32}
                        />
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-debut-stream">
                            Debut Stream <span className="suggestion-field-hint">(VOD URL)</span>
                        </label>
                        <input
                            id="add-debut-stream"
                            className="suggestion-input"
                            type="text"
                            value={debutStream}
                            onChange={(e) => setDebutStream(e.target.value)}
                            maxLength={500}
                        />
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-group">
                            Group
                        </label>
                        <select
                            id="add-group"
                            className="suggestion-select"
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                        >
                            <option value="">— None —</option>
                            {groupOptions.map((g) => (
                                <option key={g} value={g}>
                                    {g}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-tags">
                            Tags <span className="suggestion-field-hint">(comma separated)</span>
                        </label>
                        <input
                            id="add-tags"
                            className="suggestion-input"
                            type="text"
                            value={tagsText}
                            onChange={(e) => setTagsText(e.target.value)}
                            placeholder="cute, dance, idol"
                        />
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-notes">
                            Notes <span className="suggestion-field-hint">(anything else for the reviewer)</span>
                        </label>
                        <textarea
                            id="add-notes"
                            className="suggestion-textarea"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            maxLength={2000}
                        />
                    </div>

                    <div className="suggestion-image-list-section">
                        <span className="suggestion-field-label">
                            Images{" "}
                            <span className="suggestion-field-hint">
                                (optional · up to {maxMb} MB · {(cfg.supported_formats ?? []).join(", ")})
                            </span>
                        </span>

                        {uploadedImages.length > 0 && (
                            <div className="suggestion-image-list">
                                {uploadedImages.map((img) => (
                                    <div key={img.id} className="suggestion-image-row">
                                        <div className="suggestion-image-row-thumb">
                                            <img src={img.urls.preview} alt="" />
                                        </div>
                                        <div className="suggestion-image-row-fields">
                                            <select
                                                className={`suggestion-image-row-type ${
                                                    img.image_type ? "" : "is-empty"
                                                }`}
                                                value={img.image_type}
                                                onChange={(e) => handleUploadedTypeChange(img.id, e.target.value)}
                                                disabled={!!busy}
                                                aria-label={`Type for ${img.file_name}`}
                                            >
                                                <option value="">Image Type</option>
                                                {IMAGE_TYPES.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                className="suggestion-image-row-source"
                                                type="text"
                                                value={img.source ?? ""}
                                                onChange={(e) => handleUploadedSourceChange(img.id, e.target.value)}
                                                placeholder="Source (tweet URL or @artist)"
                                                maxLength={500}
                                                disabled={!!busy}
                                                aria-label={`Source for ${img.file_name}`}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="suggestion-image-row-remove"
                                            onClick={() => handleRemoveUploaded(img.id)}
                                            aria-label={`Remove ${img.file_name}`}
                                            disabled={!!busy}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="suggestion-image-add-block">
                            <details className="suggestion-image-type-guide">
                                <summary>What does each type mean?</summary>
                                <ul>
                                    <li>
                                        <strong>Headshot</strong> — the main image shown on the homepage
                                    </li>
                                    <li>
                                        <strong>Reference</strong> — reference images that artists or fans can use
                                    </li>
                                    <li>
                                        <strong>Screenshot</strong> — captures from a stream or video
                                    </li>
                                    <li>
                                        <strong>Asset</strong> — anything else
                                    </li>
                                </ul>
                            </details>

                            <div className="suggestion-image-add-dropzone">
                                <ImageDropZone
                                    accept={acceptList}
                                    multiple
                                    onSelect={handleFileSelected}
                                    previewSrc={localPreviewUrl}
                                    overlay={dropzoneOverlay}
                                    onClear={handleClearQueue}
                                    clearable={pickedQueue.length > 0 && !busy}
                                    placeholder="Drop one or many images, or click to browse"
                                    hint="Set the type & source on each row after upload"
                                    disabled={busy === "submitting"}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="suggestion-turnstile-block">
                        <span className="suggestion-field-hint">Human verification:</span>
                        <TurnstileWidget
                            siteKey={cfg.turnstile_site_key}
                            onToken={setTurnstileToken}
                            resetRef={turnstileResetRef}
                        />
                    </div>

                    {error && <div className="suggestion-status error">{error}</div>}

                    <div className="suggestion-actions">
                        <button type="submit" className="suggestion-submit-btn" disabled={!canSubmit}>
                            {busy === "submitting" ? "Submitting…" : "Submit Suggestion"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
