import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AddDoki from "./AddDoki";

vi.mock("../utils/contentApi", () => ({
    fetchPublicConfig: vi.fn(() =>
        Promise.resolve({
            turnstile_site_key: "test-key",
            allowed_sites: ["dokinomicon"],
            max_image_bytes: 26214400,
            supported_formats: ["png", "jpg", "webp"],
            public_url_prefix: "https://cdn.test",
            pending_prefix: "_pending/",
        }),
    ),
    uploadImage: vi.fn(),
    submitSuggestion: vi.fn(),
    validateImageFile: vi.fn(() => null),
}));

vi.mock("../components/TurnstileWidget", () => ({
    default: () => <div data-testid="turnstile" />,
}));

vi.mock("../components/UnsavedChangesGuard", () => ({
    default: () => null,
}));

describe("AddDoki", () => {
    it("renders the form fields once config is loaded", async () => {
        render(
            <MemoryRouter>
                <AddDoki />
            </MemoryRouter>,
        );

        await waitFor(() => expect(screen.getByText(/Suggest a New Doki/i)).toBeInTheDocument());

        expect(screen.getByLabelText(/^Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Artists/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Tags/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Group$/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Parent ID/i)).not.toBeInTheDocument();
        // No pre-upload type radios or source field — those are edited per-row instead.
        expect(screen.queryByRole("radio", { name: /Headshot/i })).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/^Source/i)).not.toBeInTheDocument();
        expect(screen.getByText(/What does each type mean\?/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Submit Suggestion/i })).toBeDisabled();
    });
});
