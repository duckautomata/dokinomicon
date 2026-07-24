import { useState, useRef, useEffect } from "react";
import { Link, useMatch } from "react-router-dom";
import "./SuggestionsDropdown.css";

export default function SuggestionsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Surface a contextual "Edit current Doki" item when the user is viewing
    // a doki, saves them from navigating to the doki's view to click the
    // inline Suggest Edit button.
    const viewMatch = useMatch("/view/:doki_id");
    const currentDokiId = viewMatch?.params?.doki_id;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const close = () => setIsOpen(false);

    return (
        <div className="suggestions-dropdown desktop-only" ref={dropdownRef}>
            <button
                className={`nav-link suggestions-btn ${isOpen ? "active" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                Suggestions
                <span className="dropdown-arrow">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
                <div className="dropdown-menu glass-panel">
                    <Link to="/add" onClick={close} className="dropdown-item">
                        <span>New Doki</span>
                    </Link>
                    {currentDokiId && (
                        <Link to={`/edit/${currentDokiId}`} onClick={close} className="dropdown-item">
                            <span>Edit current Doki</span>
                        </Link>
                    )}
                    <Link to="/suggestion" onClick={close} className="dropdown-item">
                        <span>General Suggestion</span>
                    </Link>
                    <Link to="/my-suggestions" onClick={close} className="dropdown-item">
                        <span>My Suggestions</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
