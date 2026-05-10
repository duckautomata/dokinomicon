import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

const tagsToText = (tags) => (Array.isArray(tags) ? tags.join(", ") : "");

const parseTags = (text) =>
    text
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

const sameTags = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((tag, i) => tag === b[i]);
};

/**
 * @param {Object} props
 * @param {DokiData[]} props.data
 */
export default function EditDoki({ data }) {
    const { doki_id } = useParams();
    const doki = useMemo(() => data.find((d) => d.doki_id === doki_id), [data, doki_id]);

    const [cfg, setCfg] = useState(null);
    const [cfgError, setCfgError] = useState(null);

    const [mode, setMode] = useState("edit");

    const [name, setName] = useState("");
    const [artists, setArtists] = useState("");
    const [description, setDescription] = useState("");
    const [debutDate, setDebutDate] = useState("");
    const [debutStream, setDebutStream] = useState("");
    const [group, setGroup] = useState("");
    const [tagsText, setTagsText] = useState("");
    const [notes, setNotes] = useState("");
    const [reason, setReason] = useState("");

    // Newly uploaded images default to an empty type (so it's obvious the user
    // never specified one) and empty source; both are edited per-row in the
    // list below the dropzone.
    const [pickedQueue, setPickedQueue] = useState([]); // [{ file, image_type, source }]
    const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
    const [uploadedImages, setUploadedImages] = useState([]);

    // Per-existing-image local edits, keyed by image_id. Tracks the user's
    // proposed type/source for each image plus a "deleted" flag the user
    // toggles when they want to suggest removing the image.
    const [existingImageState, setExistingImageState] = useState({});

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
        if (doki?.group) set.add(doki.group);
        return Array.from(set).sort();
    }, [data, doki]);

    // Flatten the doki's existing images across all type buckets into a single
    // ordered list. We keep the original type-grouping order (Headshot,
    // Reference, Screenshot, Asset) so the rows render predictably.
    const allExistingImages = useMemo(() => {
        if (!doki) return [];
        return [
            ...(doki.images?.Headshot ?? []),
            ...(doki.images?.Reference ?? []),
            ...(doki.images?.Screenshot ?? []),
            ...(doki.images?.Asset ?? []),
        ];
    }, [doki]);

    useEffect(() => {
        fetchPublicConfig()
            .then(setCfg)
            .catch((err) => {
                LOG_ERROR("Failed to fetch public config", err);
                setCfgError(err.message);
            });
    }, []);

    useEffect(() => {
        if (!doki) return;
        setName(doki.name ?? "");
        setArtists(doki.artists ?? "");
        setDescription(doki.description ?? "");
        setDebutDate(doki.debut_date ?? "");
        setDebutStream(doki.debut_stream ?? "");
        setGroup(doki.group ?? "");
        setTagsText(tagsToText(doki.tags));
        // Seed the per-image edit state with each existing image's current
        // values; the user mutates these via the rows in Current Images.
        const initial = {};
        for (const img of allExistingImages) {
            initial[img.image_id] = {
                image_type: img.image_type ?? "",
                source: img.source ?? "",
                deleted: false,
            };
        }
        setExistingImageState(initial);
    }, [doki, allExistingImages]);

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

    const editChanges = useMemo(() => {
        if (!doki) return {};
        const changes = {};
        if (name.trim() !== (doki.name ?? "")) changes.name = name.trim();
        if (artists.trim() !== (doki.artists ?? "")) changes.artists = artists.trim();
        if (description.trim() !== (doki.description ?? "")) changes.description = description.trim();
        if (debutDate.trim() !== (doki.debut_date ?? "")) changes.debut_date = debutDate.trim();
        if (debutStream.trim() !== (doki.debut_stream ?? "")) changes.debut_stream = debutStream.trim();
        if (group.trim() !== (doki.group ?? "")) changes.group = group.trim();
        const newTags = parseTags(tagsText);
        if (!sameTags(newTags, doki.tags ?? [])) changes.tags = newTags;
        return changes;
    }, [name, artists, description, debutDate, debutStream, group, tagsText, doki]);

    // Diff existingImageState against the original doki images; returns the
    // edited rows (only those whose type or source actually changed) and the
    // ids of rows the user marked for deletion.
    const existingImageChanges = useMemo(() => {
        const edits = [];
        const deletes = [];
        for (const img of allExistingImages) {
            const state = existingImageState[img.image_id];
            if (!state) continue;
            if (state.deleted) {
                deletes.push(img.image_id);
                continue;
            }
            const origType = img.image_type ?? "";
            const origSource = img.source ?? "";
            if (state.image_type !== origType || state.source !== origSource) {
                edits.push({
                    image_id: img.image_id,
                    image_type: state.image_type,
                    source: state.source,
                });
            }
        }
        return { edits, deletes };
    }, [allExistingImages, existingImageState]);

    if (!doki) {
        return (
            <div className="suggestion-page">
                <Link to="/" className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Gallery
                </Link>
                <div className="suggestion-card glass-panel">
                    <h1 className="suggestion-title">Doki not found</h1>
                    <p className="suggestion-subtitle">
                        No doki was found with id <code>{doki_id}</code>.
                    </p>
                </div>
            </div>
        );
    }

    const editHasFieldChanges = Object.keys(editChanges).length > 0;
    const editHasNewImages = uploadedImages.length > 0;
    const editHasExistingImageChanges =
        existingImageChanges.edits.length > 0 || existingImageChanges.deletes.length > 0;
    const canSubmitEdit =
        (editHasFieldChanges || editHasNewImages || editHasExistingImageChanges) &&
        !!turnstileToken &&
        !busy &&
        name.trim().length > 0;
    const canSubmitDelete = reason.trim().length > 0 && !!turnstileToken && !busy;

    const isDirty =
        !success &&
        (mode === "edit"
            ? editHasFieldChanges ||
              editHasNewImages ||
              editHasExistingImageChanges ||
              pickedQueue.length > 0 ||
              notes.trim().length > 0
            : reason.trim().length > 0);

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

    const handleExistingTypeChange = (imageId, newType) => {
        setExistingImageState((prev) => ({
            ...prev,
            [imageId]: { ...prev[imageId], image_type: newType },
        }));
    };

    const handleExistingSourceChange = (imageId, newSource) => {
        setExistingImageState((prev) => ({
            ...prev,
            [imageId]: { ...prev[imageId], source: newSource },
        }));
    };

    const handleToggleExistingDelete = (imageId) => {
        if (busy) return;
        setExistingImageState((prev) => ({
            ...prev,
            [imageId]: { ...prev[imageId], deleted: !prev[imageId]?.deleted },
        }));
    };

    const handleResetEdits = () => {
        if (busy || !doki) return;
        setName(doki.name ?? "");
        setArtists(doki.artists ?? "");
        setDescription(doki.description ?? "");
        setDebutDate(doki.debut_date ?? "");
        setDebutStream(doki.debut_stream ?? "");
        setGroup(doki.group ?? "");
        setTagsText(tagsToText(doki.tags));
        setNotes("");
        setUploadedImages([]);
        setPickedQueue([]);
        const initial = {};
        for (const img of allExistingImages) {
            initial[img.image_id] = {
                image_type: img.image_type ?? "",
                source: img.source ?? "",
                deleted: false,
            };
        }
        setExistingImageState(initial);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (mode === "edit") {
            if (!canSubmitEdit) return;
            setBusy("submitting");
            try {
                const payload = {
                    target_id: doki.doki_id,
                    changes: editChanges,
                    notes: notes.trim(),
                };
                if (uploadedImages.length > 0) {
                    payload.new_images = uploadedImages.map((img) => ({
                        image_id: img.id,
                        image_type: img.image_type,
                        source: img.source,
                        file_name: img.file_name,
                    }));
                }
                if (existingImageChanges.edits.length > 0) {
                    payload.edited_images = existingImageChanges.edits;
                }
                if (existingImageChanges.deletes.length > 0) {
                    payload.deleted_images = existingImageChanges.deletes;
                }
                const result = await submitSuggestion({
                    token: turnstileToken,
                    kind: "edit",
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
        } else {
            if (!canSubmitDelete) return;
            setBusy("submitting");
            try {
                const result = await submitSuggestion({
                    token: turnstileToken,
                    kind: "delete",
                    payload: {
                        target_id: doki.doki_id,
                        reason: reason.trim(),
                    },
                });
                setSuccess(result);
            } catch (err) {
                LOG_ERROR("Submit failed", err);
                setError(`Submission failed: ${err.message}`);
            } finally {
                setBusy(null);
                turnstileResetRef.current?.();
            }
        }
    };

    const handleModeChange = (newMode) => {
        if (busy || success) return;
        setMode(newMode);
        setError(null);
    };

    if (cfgError) {
        return (
            <div className="suggestion-page">
                <Link to={`/view/${doki.doki_id}`} className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Doki
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
                <Link to={`/view/${doki.doki_id}`} className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Doki
                </Link>
                <div className="suggestion-card glass-panel">
                    <h1 className="suggestion-title">Thanks!</h1>
                    <p className="suggestion-subtitle">
                        Your {mode === "delete" ? "deletion" : "edit"} suggestion has been submitted for review.
                        Reference ID: <code>{success.id}</code>
                    </p>
                    <div className="suggestion-actions">
                        <Link
                            to={`/view/${doki.doki_id}`}
                            className="suggestion-submit-btn"
                            style={{ textDecoration: "none" }}
                        >
                            Back to Doki
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const maxMb = (cfg.max_image_bytes / (1024 * 1024)).toFixed(0);
    const acceptList = (cfg.supported_formats ?? []).map((f) => `.${f}`).join(",");
    const currentHeadshot = doki.images?.Headshot?.[0];

    let dropzoneOverlay = null;
    if (busy === "uploading") {
        dropzoneOverlay = pickedQueue.length > 1 ? `Uploading… (${pickedQueue.length} left)` : "Uploading…";
    } else if (pickedQueue.length > 0 && !turnstileToken) {
        dropzoneOverlay = "Waiting for verification…";
    }

    return (
        <div className="suggestion-page">
            <UnsavedChangesGuard when={isDirty} />
            <Link to={`/view/${doki.doki_id}`} className="suggestion-back">
                <span className="back-arrow">←</span> Back to Doki
            </Link>
            <div className="suggestion-card glass-panel">
                <h1 className="suggestion-title">Suggest a Change</h1>
                <p className="suggestion-subtitle">
                    Editing <strong>{doki.name}</strong>. An admin will review before any changes go live.
                </p>

                <div className="suggestion-mode-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        className={`suggestion-mode-tab ${mode === "edit" ? "active" : ""}`}
                        aria-selected={mode === "edit"}
                        onClick={() => handleModeChange("edit")}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        role="tab"
                        className={`suggestion-mode-tab ${mode === "delete" ? "active" : ""}`}
                        aria-selected={mode === "delete"}
                        onClick={() => handleModeChange("delete")}
                    >
                        Delete
                    </button>
                </div>

                <form className="suggestion-form" onSubmit={handleSubmit}>
                    {mode === "edit" ? (
                        <>
                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-name">
                                    Name <span className="suggestion-field-required">*</span>
                                </label>
                                <input
                                    id="edit-name"
                                    className="suggestion-input"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    maxLength={100}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-artists">
                                    Artists <span className="suggestion-field-hint">(comma separated)</span>
                                </label>
                                <input
                                    id="edit-artists"
                                    className="suggestion-input"
                                    type="text"
                                    value={artists}
                                    onChange={(e) => setArtists(e.target.value)}
                                    maxLength={500}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-description">
                                    Description
                                </label>
                                <textarea
                                    id="edit-description"
                                    className="suggestion-textarea"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={5000}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-debut-date">
                                    Debut Date <span className="suggestion-field-hint">(YYYY-MM-DD)</span>
                                </label>
                                <input
                                    id="edit-debut-date"
                                    className="suggestion-input"
                                    type="text"
                                    value={debutDate}
                                    onChange={(e) => setDebutDate(e.target.value)}
                                    maxLength={32}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-debut-stream">
                                    Debut Stream <span className="suggestion-field-hint">(VOD URL)</span>
                                </label>
                                <input
                                    id="edit-debut-stream"
                                    className="suggestion-input"
                                    type="text"
                                    value={debutStream}
                                    onChange={(e) => setDebutStream(e.target.value)}
                                    maxLength={500}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-group">
                                    Group
                                </label>
                                <select
                                    id="edit-group"
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
                                <label className="suggestion-field-label" htmlFor="edit-tags">
                                    Tags <span className="suggestion-field-hint">(comma separated)</span>
                                </label>
                                <input
                                    id="edit-tags"
                                    className="suggestion-input"
                                    type="text"
                                    value={tagsText}
                                    onChange={(e) => setTagsText(e.target.value)}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-notes">
                                    Notes <span className="suggestion-field-hint">(context for the reviewer)</span>
                                </label>
                                <textarea
                                    id="edit-notes"
                                    className="suggestion-textarea"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    maxLength={2000}
                                />
                            </div>

                            {allExistingImages.length > 0 && (
                                <div className="suggestion-image-list-section">
                                    <span className="suggestion-field-label">
                                        Current Images{" "}
                                        <span className="suggestion-field-hint">
                                            ({allExistingImages.length}) · edit type/source or mark for deletion
                                        </span>
                                    </span>
                                    <div className="suggestion-image-list">
                                        {allExistingImages.map((img) => {
                                            const state = existingImageState[img.image_id] ?? {
                                                image_type: img.image_type ?? "",
                                                source: img.source ?? "",
                                                deleted: false,
                                            };
                                            const isDeleted = !!state.deleted;
                                            const label = img.image_name || img.image_id;
                                            return (
                                                <div
                                                    key={img.image_id}
                                                    className={`suggestion-image-row ${isDeleted ? "marked-deleted" : ""}`}
                                                >
                                                    <div className="suggestion-image-row-thumb">
                                                        <img
                                                            src={img.urlThumb || img.urlWebp}
                                                            alt={label}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="suggestion-image-row-fields">
                                                        {isDeleted ? (
                                                            <span className="suggestion-image-row-deleted-label">
                                                                Will request deletion
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <select
                                                                    className="suggestion-image-row-type"
                                                                    value={state.image_type}
                                                                    onChange={(e) =>
                                                                        handleExistingTypeChange(
                                                                            img.image_id,
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    disabled={!!busy}
                                                                    aria-label={`Type for ${label}`}
                                                                >
                                                                    {IMAGE_TYPES.map((opt) => (
                                                                        <option key={opt} value={opt}>
                                                                            {opt}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    className="suggestion-image-row-source"
                                                                    type="text"
                                                                    value={state.source}
                                                                    onChange={(e) =>
                                                                        handleExistingSourceChange(
                                                                            img.image_id,
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    placeholder="Source (tweet URL or @artist)"
                                                                    maxLength={500}
                                                                    disabled={!!busy}
                                                                    aria-label={`Source for ${label}`}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="suggestion-image-row-remove"
                                                        onClick={() => handleToggleExistingDelete(img.image_id)}
                                                        aria-label={
                                                            isDeleted
                                                                ? `Undo deletion of ${label}`
                                                                : `Mark ${label} for deletion`
                                                        }
                                                        title={isDeleted ? "Undo deletion" : "Mark for deletion"}
                                                        disabled={!!busy}
                                                    >
                                                        {isDeleted ? "↺" : "×"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="suggestion-image-list-section">
                                <span className="suggestion-field-label">
                                    New Images{" "}
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
                                                        onChange={(e) =>
                                                            handleUploadedTypeChange(img.id, e.target.value)
                                                        }
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
                                                        onChange={(e) =>
                                                            handleUploadedSourceChange(img.id, e.target.value)
                                                        }
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
                                                <strong>Reference</strong> — reference images that artists or fans can
                                                use
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
                                            placeholder="Drop one or many images, or click"
                                            hint="Set the type & source on each row after upload"
                                            disabled={busy === "submitting"}
                                        />
                                    </div>
                                </div>
                            </div>

                            {!editHasFieldChanges && !editHasNewImages && !editHasExistingImageChanges && (
                                <div className="suggestion-status info">
                                    Make a change above (edit a field, add a new image, or edit/delete a current image)
                                    to enable submission.
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="suggestion-image-section">
                                <span className="suggestion-field-label">Current</span>
                                {currentHeadshot ? (
                                    <div className="suggestion-image-display compact">
                                        <img src={currentHeadshot.urlWebp} alt={`Current ${doki.name}`} />
                                    </div>
                                ) : (
                                    <div className="suggestion-image-display compact" />
                                )}
                            </div>
                            <div className="suggestion-status info">
                                You are requesting deletion of <strong>{doki.name}</strong>. Tell the reviewer why.
                            </div>
                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="delete-reason">
                                    Reason <span className="suggestion-field-required">*</span>
                                </label>
                                <textarea
                                    id="delete-reason"
                                    className="suggestion-textarea"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. duplicate of another doki, violates guidelines, …"
                                    required
                                    maxLength={2000}
                                />
                            </div>
                        </>
                    )}

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
                        {mode === "edit" ? (
                            <>
                                <button type="submit" className="suggestion-submit-btn" disabled={!canSubmitEdit}>
                                    {busy === "submitting" ? "Submitting…" : "Submit Edit"}
                                </button>
                                <button
                                    type="button"
                                    className="suggestion-secondary-btn"
                                    onClick={handleResetEdits}
                                    disabled={
                                        !!busy ||
                                        (!editHasFieldChanges && !editHasNewImages && !editHasExistingImageChanges)
                                    }
                                >
                                    Reset Changes
                                </button>
                            </>
                        ) : (
                            <button type="submit" className="suggestion-submit-btn danger" disabled={!canSubmitDelete}>
                                {busy === "submitting" ? "Submitting…" : "Request Deletion"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
