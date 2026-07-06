import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MdxPre } from "./MdxPre";

vi.mock("./Mermaid", () => ({
    Mermaid: ({ chart }: { chart: string }) => <div data-testid="mermaid">{chart}</div>,
}));

describe("MdxPre", () => {
    it("renders a Mermaid diagram for a language-mermaid code block", async () => {
        render(
            <MdxPre>
                <code className="language-mermaid">graph TD; A--&gt;B;</code>
            </MdxPre>,
        );

        expect((await screen.findByTestId("mermaid")).textContent).toBe("graph TD; A-->B;");
    });

    it("passes non-mermaid code blocks through as a plain pre", () => {
        const { container } = render(
            <MdxPre>
                <code className="language-typescript">const x = 1;</code>
            </MdxPre>,
        );

        expect(screen.queryByTestId("mermaid")).toBeNull();
        expect(container.querySelector("pre code.language-typescript")?.textContent).toBe("const x = 1;");
    });

    it("falls through to a plain pre for non-standard children without crashing", () => {
        const { container } = render(<MdxPre>just a string, not a single element child</MdxPre>);

        expect(container.querySelector("pre")?.textContent).toBe("just a string, not a single element child");
    });

    it("falls through to a plain pre when there are multiple children", () => {
        const { container } = render(
            <MdxPre>
                <span>first</span>
                <span>second</span>
            </MdxPre>,
        );

        expect(container.querySelector("pre")).not.toBeNull();
        expect(screen.queryByTestId("mermaid")).toBeNull();
    });

    it("extracts textContent from nested elements for the mermaid chart source", async () => {
        render(
            <MdxPre>
                <code className="language-mermaid">
                    <span>graph TD;</span>
                    <span> A--&gt;B;</span>
                </code>
            </MdxPre>,
        );

        expect((await screen.findByTestId("mermaid")).textContent).toBe("graph TD; A-->B;");
    });
});
