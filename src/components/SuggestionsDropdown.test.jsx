import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SuggestionsDropdown from "./SuggestionsDropdown";

const renderAt = (path, ui) => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
const renderWithRouter = (ui) => renderAt("/", ui);

describe("SuggestionsDropdown", () => {
    it("renders the button initially closed", () => {
        renderWithRouter(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-expanded", "false");

        // Dropdown menu should not be visible
        expect(screen.queryByText("New Doki")).not.toBeInTheDocument();
    });

    it("opens the dropdown when clicked", () => {
        renderWithRouter(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });

        fireEvent.click(button);

        expect(button).toHaveAttribute("aria-expanded", "true");

        const newDokiLink = screen.getByText("New Doki").closest("a");
        const generalLink = screen.getByText("General Suggestion").closest("a");

        expect(newDokiLink).toHaveAttribute("href", "/add");
        expect(generalLink).toHaveAttribute("href", "/suggestion");
    });

    it("closes the dropdown when clicking outside", () => {
        renderWithRouter(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });

        fireEvent.click(button); // open it
        expect(screen.getByText("New Doki")).toBeInTheDocument();

        fireEvent.mouseDown(document.body); // simulate click outside

        expect(screen.queryByText("New Doki")).not.toBeInTheDocument();
    });

    it("does not show 'Edit current Doki' when not on a view page", () => {
        renderAt("/", <SuggestionsDropdown />);
        fireEvent.click(screen.getByRole("button", { name: /Suggestions/i }));

        expect(screen.queryByText(/Edit current Doki/i)).not.toBeInTheDocument();
    });

    it("shows 'Edit current Doki' linking to the current doki when on a view page", () => {
        renderAt("/view/test-doki-1", <SuggestionsDropdown />);
        fireEvent.click(screen.getByRole("button", { name: /Suggestions/i }));

        const editLink = screen.getByText(/Edit current Doki/i).closest("a");
        expect(editLink).toHaveAttribute("href", "/edit/test-doki-1");
    });
});
