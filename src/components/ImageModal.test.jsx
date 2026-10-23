import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ImageModal from "./ImageModal";

describe("ImageModal", () => {
    const mockImages = [
        {
            image_name: "Image 1",
            urlWebp: "img1.webp",
            image_ext: ".webp",
        },
        {
            image_name: "Video 1",
            urlOrig: "vid1.mp4",
            image_ext: ".mp4",
        },
    ];

    const mockOnClose = vi.fn();
    const mockOnNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders image correctly", () => {
        render(<ImageModal images={mockImages} selectedIndex={0} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

        expect(screen.getByText("Image 1")).toBeInTheDocument();
        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("src", "img1.webp");
        expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("renders video correctly", () => {
        render(<ImageModal images={mockImages} selectedIndex={1} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

        expect(screen.getByText("Video 1")).toBeInTheDocument();
        // Since it's a video tag, try to find it by tag or src
        const video = document.querySelector("video");
        expect(video).toBeInTheDocument();
        expect(video).toHaveAttribute("src", "vid1.mp4");
        expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });

    it("calls onNavigate when clicking next", () => {
        render(<ImageModal images={mockImages} selectedIndex={0} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

        const nextBtn = screen.getByRole("button", { name: /Next Image/i });
        fireEvent.click(nextBtn);

        expect(mockOnNavigate).toHaveBeenCalledWith(1);
    });

    it("calls onClose when clicking close button", () => {
        render(<ImageModal images={mockImages} selectedIndex={0} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

        const closeBtn = screen.getByRole("button", { name: "Close" });
        fireEvent.click(closeBtn);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose when clicking overlay", () => {
        render(<ImageModal images={mockImages} selectedIndex={0} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

        // finding parent div
        const overlay = document.querySelector(".modal-overlay");
        fireEvent.click(overlay);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it("renders the source as a link when it is a URL", () => {
        const images = [
            {
                image_name: "With URL source",
                urlWebp: "x.webp",
                image_ext: ".webp",
                source: "https://twitter.com/artist/status/123",
            },
        ];
        render(<ImageModal images={images} selectedIndex={0} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

        const link = screen.getByRole("link", { name: /Source/i });
        expect(link).toHaveAttribute("href", "https://twitter.com/artist/status/123");
        expect(link).toHaveAttribute("target", "_blank");
        // The URL itself is the link text, so it reads as a link
        expect(link).toHaveTextContent("twitter.com/artist/status/123");
        // No "Source: ..." plain text version when it's a link
        expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
    });

    it("keeps the full source url in the title, where the cropped text can't show it", () => {
        const source = "https://twitter.com/a_very_long_artist_handle/status/1234567890123456789";
        const images = [
            {
                image_name: "With long URL source",
                urlWebp: "x.webp",
                image_ext: ".webp",
                source,
            },
        ];
        render(<ImageModal images={images} selectedIndex={0} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

        const link = screen.getByRole("link", { name: /Source/i });
        expect(link).toHaveAttribute("href", source);
        expect(link).toHaveAttribute("title", source);
        // Visible text is the url without its scheme; CSS crops it to fit
        expect(link.querySelector(".source-link-url")).toHaveTextContent(
            "twitter.com/a_very_long_artist_handle/status/1234567890123456789",
        );
    });

    it("renders the source as plain text when it is not a URL", () => {
        const images = [
            {
                image_name: "With text source",
                urlWebp: "x.webp",
                image_ext: ".webp",
                source: "@artist_handle",
            },
        ];
        render(<ImageModal images={images} selectedIndex={0} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

        // Shown as a text badge, not a link
        expect(screen.queryByRole("link", { name: /Source/i })).not.toBeInTheDocument();
        expect(screen.getByText(/Source: @artist_handle/)).toBeInTheDocument();
    });
});
