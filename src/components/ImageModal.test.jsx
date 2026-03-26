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
});
