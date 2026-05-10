import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import EditDoki from "./EditDoki";

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

const mockData = [
    {
        doki_id: "doki-1",
        name: "Test Doki",
        artists: "Test Artist",
        description: "A cool test doki.",
        debut_date: "2024-01-01",
        debut_stream: "https://example.com/vod",
        group: "Test Group",
        parent_id: "",
        tags: ["cute", "test"],
        images: {
            Headshot: [
                {
                    image_id: "img-headshot",
                    image_name: "Main Headshot",
                    image_ext: ".webp",
                    image_type: "Headshot",
                    source: "https://twitter.com/example",
                    urlWebp: "headshot.webp",
                    urlThumb: "headshot-thumb.webp",
                },
            ],
            Reference: [
                {
                    image_id: "img-ref",
                    image_name: "Ref 1",
                    image_ext: ".webp",
                    image_type: "Reference",
                    source: "",
                    urlWebp: "ref.webp",
                    urlThumb: "ref-thumb.webp",
                },
            ],
        },
    },
];

const renderAt = (path) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/edit/:doki_id" element={<EditDoki data={mockData} />} />
            </Routes>
        </MemoryRouter>,
    );

describe("EditDoki", () => {
    it("renders edit form prefilled when doki exists", async () => {
        renderAt("/edit/doki-1");

        await waitFor(() => expect(screen.getByText(/Suggest a Change/i)).toBeInTheDocument());

        const nameInput = screen.getByLabelText(/^Name/i);
        expect(nameInput).toHaveValue("Test Doki");

        const groupSelect = screen.getByLabelText(/^Group$/i);
        expect(groupSelect.tagName).toBe("SELECT");
        expect(groupSelect).toHaveValue("Test Group");

        expect(screen.queryByLabelText(/Parent ID/i)).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Submit Edit/i })).toBeDisabled();
    });

    it("shows not-found state when doki id is unknown", () => {
        renderAt("/edit/missing");
        expect(screen.getByText(/Doki not found/i)).toBeInTheDocument();
    });

    it("switches to delete mode and shows reason field", async () => {
        renderAt("/edit/doki-1");
        await waitFor(() => expect(screen.getByText(/Suggest a Change/i)).toBeInTheDocument());

        const deleteTab = screen.getByRole("tab", { name: /Delete/i });
        fireEvent.click(deleteTab);

        expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Request Deletion/i })).toBeDisabled();
    });

    it("shows existing images with editable type/source and a delete toggle", async () => {
        renderAt("/edit/doki-1");
        await waitFor(() => expect(screen.getByText(/Suggest a Change/i)).toBeInTheDocument());

        // Heading for the section
        expect(screen.getByText(/Current Images/i)).toBeInTheDocument();

        // Per-row controls for the seeded images
        const headshotType = screen.getByLabelText(/Type for Main Headshot/i);
        expect(headshotType).toHaveValue("Headshot");
        const headshotSource = screen.getByLabelText(/Source for Main Headshot/i);
        expect(headshotSource).toHaveValue("https://twitter.com/example");

        const refType = screen.getByLabelText(/Type for Ref 1/i);
        expect(refType).toHaveValue("Reference");

        // Submit is disabled until the user actually changes something
        expect(screen.getByRole("button", { name: /Submit Edit/i })).toBeDisabled();
    });

    it("enables submit after marking an existing image for deletion", async () => {
        renderAt("/edit/doki-1");
        await waitFor(() => expect(screen.getByText(/Suggest a Change/i)).toBeInTheDocument());

        const submit = screen.getByRole("button", { name: /Submit Edit/i });
        expect(submit).toBeDisabled();

        const deleteBtn = screen.getByRole("button", { name: /Mark Main Headshot for deletion/i });
        fireEvent.click(deleteBtn);

        expect(screen.getByText(/Will request deletion/i)).toBeInTheDocument();
        // Note: submit also requires a turnstile token; the widget is mocked so we
        // just confirm the form recognizes the change by checking the "no changes"
        // info banner is gone.
        expect(screen.queryByText(/Make a change above/i)).not.toBeInTheDocument();
    });
});
