import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./SuggestionsDropdown.css";

export default function SuggestionsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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
                    <Link to="/suggestion" onClick={close} className="dropdown-item">
                        <span>General Suggestion</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
