import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TurnstileWidget from "../components/TurnstileWidget";
import UnsavedChangesGuard from "../components/UnsavedChangesGuard";
import { fetchPublicConfig, submitSuggestion } from "../utils/contentApi";
import { LOG_ERROR } from "../utils/debug";
import "./SuggestionForms.css";

export default function Suggestion() {
    const [cfg, setCfg] = useState(null);
    const [cfgError, setCfgError] = useState(null);

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    // `null` = waiting on the widget; `""` = Turnstile disabled by the server
    // (submit-ready immediately); any other string = an actual issued token.
    // The page is submittable whenever this is non-null, so `=== null` is the
    // canonical "still waiting" check.
    const [turnstileToken, setTurnstileToken] = useState(null);
    const turnstileResetRef = useRef(null);

    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchPublicConfig()
            .then(setCfg)
            .catch((err) => {
                LOG_ERROR("Failed to fetch public config", err);
                setCfgError(err.message);
            });
    }, []);

    // Server-controlled toggle. Default to enabled if the field is missing
    // (older backend that doesn't return it yet) so we never accidentally
    // bypass verification when we shouldn't.
    const turnstileEnabled = cfg?.turnstile_enabled ?? true;

    // When the server says Turnstile is off, the widget never mounts so it
    // never emits onToken(""). Sync the token state here so submit gates open
    // as soon as the page is interactive.
    useEffect(() => {
        if (cfg && !turnstileEnabled) {
            setTurnstileToken("");
        }
    }, [cfg, turnstileEnabled]);

    const canSubmit = message.trim().length > 0 && turnstileToken !== null && !busy;
    const isDirty = !success && (subject.trim().length > 0 || message.trim().length > 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError(null);
        setBusy("submitting");
        try {
            const payload = {
                suggestion_type: "general",
                subject: subject.trim(),
                message: message.trim(),
            };
            const result = await submitSuggestion({
                token: turnstileToken,
                kind: "new",
                payload,
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
                        Your suggestion has been received. Reference ID: <code>{success.id}</code>
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

    return (
        <div className="suggestion-page">
            <UnsavedChangesGuard when={isDirty} />
            <Link to="/" className="suggestion-back">
                <span className="back-arrow">←</span> Back to Gallery
            </Link>
            <div className="suggestion-card glass-panel">
                <h1 className="suggestion-title">General Suggestion</h1>
                <p className="suggestion-subtitle">Have feedback or an idea about the Dokinomicon? Send it here.</p>

                <form className="suggestion-form" onSubmit={handleSubmit}>
                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="suggestion-subject">
                            Subject <span className="suggestion-field-hint">(optional)</span>
                        </label>
                        <input
                            id="suggestion-subject"
                            className="suggestion-input"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            maxLength={200}
                        />
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="suggestion-message">
                            Message <span className="suggestion-field-required">*</span>
                        </label>
                        <textarea
                            id="suggestion-message"
                            className="suggestion-textarea"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            maxLength={5000}
                        />
                    </div>

                    {turnstileEnabled && (
                        <div className="suggestion-turnstile-block">
                            <span className="suggestion-field-hint">Human verification:</span>
                            <TurnstileWidget
                                enabled={turnstileEnabled}
                                siteKey={cfg.turnstile_site_key}
                                onToken={setTurnstileToken}
                                resetRef={turnstileResetRef}
                            />
                        </div>
                    )}

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
