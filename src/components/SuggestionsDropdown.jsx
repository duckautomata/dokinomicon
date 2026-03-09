import { useState, useRef, useEffect } from "react";
import { new_doki_form, general_form, edit_doki_form } from "../config";
import "./SuggestionsDropdown.css";

const ExternalLinkIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="external-link-icon"
    >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
);

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
                    <a href={new_doki_form} target="_blank" rel="noopener noreferrer" className="dropdown-item">
                        <span>New Doki</span>
                        <ExternalLinkIcon />
                    </a>
                    <a href={general_form} target="_blank" rel="noopener noreferrer" className="dropdown-item">
                        <span>General Suggestion</span>
                        <ExternalLinkIcon />
                    </a>
                    <a href={edit_doki_form} target="_blank" rel="noopener noreferrer" className="dropdown-item">
                        <span>Edit Doki</span>
                        <ExternalLinkIcon />
                    </a>
                </div>
            )}
        </div>
    );
}
