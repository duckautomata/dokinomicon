import { site } from "../site";
import "../pages/SuggestionForms.css";

/**
 * Shown in place of the whole app when the archive (data.csv / images.csv)
 * can't be fetched or parsed. In dev mode the error message is included to
 * make debugging easier.
 *
 * @param {Object} props
 * @param {unknown} props.error
 * @param {() => void} props.onRetry - loads the data again
 */
export default function DataLoadError({ error, onRetry }) {
    const showDetail = import.meta.env.DEV && error instanceof Error && error.message;

    return (
        <main className="content">
            <div className="suggestion-page">
                <div className="suggestion-card glass-panel route-error-card" role="alert">
                    <h1 className="suggestion-title">Couldn&apos;t load the {site.shortTitle}</h1>
                    <p className="suggestion-subtitle">
                        Something went wrong while loading the archive. Check your connection and try again.
                    </p>
                    {showDetail && <pre className="route-error-stack">{error.message}</pre>}
                    <div className="suggestion-actions">
                        <button type="button" className="suggestion-submit-btn" onClick={onRetry}>
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
