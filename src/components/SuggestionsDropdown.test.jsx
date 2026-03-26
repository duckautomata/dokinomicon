import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SuggestionsDropdown from "./SuggestionsDropdown";
import { new_doki_form, general_form, edit_doki_form } from "../config";

describe("SuggestionsDropdown", () => {
    it("renders the button initially closed", () => {
        render(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-expanded", "false");

        // Dropdown menu should not be visible
        expect(screen.queryByText("New Doki")).not.toBeInTheDocument();
    });

    it("opens the dropdown when clicked", () => {
        render(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });

        fireEvent.click(button);

        expect(button).toHaveAttribute("aria-expanded", "true");

        // Dropdown items should be visible
        const newDokiLink = screen.getByText("New Doki").closest("a");
        const generalLink = screen.getByText("General Suggestion").closest("a");
        const editLink = screen.getByText("Edit Doki").closest("a");

        expect(newDokiLink).toHaveAttribute("href", new_doki_form);
        expect(generalLink).toHaveAttribute("href", general_form);
        expect(editLink).toHaveAttribute("href", edit_doki_form);
    });

    it("closes the dropdown when clicking outside", () => {
        render(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });

        fireEvent.click(button); // open it
        expect(screen.getByText("New Doki")).toBeInTheDocument();

        fireEvent.mouseDown(document.body); // simulate click outside

        expect(screen.queryByText("New Doki")).not.toBeInTheDocument();
    });
});
