import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGithubActivity } from "./useGithubActivity";
import type { GithubActivityData } from "@common/GithubActivityEvent";

interface MockES {
    onerror: ((event: Event) => void) | null;
    onopen: (() => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    close: ReturnType<typeof vi.fn>;
}

let mockEs: MockES;

const MockEventSource = vi.fn(function (this: MockES) {
    this.onerror = null;
    this.onopen = null;
    this.onmessage = null;
    this.close = vi.fn();
    mockEs = this;
});

vi.stubGlobal("EventSource", MockEventSource);

const makeActivity = (
    repoUrl: string,
    sha = "abc123",
    timestamp = "2024-01-01T00:00:00.000Z",
): GithubActivityData => ({
    repository: { name: repoUrl.split("/").pop() ?? repoUrl, url: repoUrl },
    commit: { sha, message: "test commit", url: `${repoUrl}/commit/${sha}` },
    timestamp,
});

const sendMessage = (data: object) => {
    mockEs.onmessage?.(new MessageEvent("message", { data: JSON.stringify(data) }));
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("useGithubActivity", () => {
    it("starts in initializing state with no items or error", () => {
        const { result } = renderHook(() => useGithubActivity());
        expect(result.current.connectionStatus).toBe("initializing");
        expect(result.current.items).toEqual([]);
        expect(result.current.error).toBeUndefined();
    });

    it("creates an EventSource pointed at /api/github/activity", () => {
        renderHook(() => useGithubActivity());
        expect(MockEventSource).toHaveBeenCalledWith(
            expect.stringContaining("/api/github/activity"),
        );
    });

    it("transitions to connected when the stream opens", () => {
        const { result } = renderHook(() => useGithubActivity());
        act(() => { mockEs.onopen?.(); });
        expect(result.current.connectionStatus).toBe("connected");
    });

    it("sets error status and message on EventSource network error", () => {
        const { result } = renderHook(() => useGithubActivity());
        act(() => { mockEs.onerror?.(new Event("error")); });
        expect(result.current.connectionStatus).toBe("error");
        expect(result.current.error).toContain("error occurred connecting to the Activity Stream");
    });

    it("populates items from an initial event", () => {
        const items = [
            makeActivity("https://github.com/user/repo-a"),
            makeActivity("https://github.com/user/repo-b"),
        ];
        const { result } = renderHook(() => useGithubActivity());
        act(() => { sendMessage({ type: "initial", data: items }); });
        expect(result.current.items).toEqual(items);
    });

    it("replaces items on a second initial event", () => {
        const first = [makeActivity("https://github.com/user/repo-a")];
        const second = [makeActivity("https://github.com/user/repo-b")];
        const { result } = renderHook(() => useGithubActivity());
        act(() => { sendMessage({ type: "initial", data: first }); });
        act(() => { sendMessage({ type: "initial", data: second }); });
        expect(result.current.items).toEqual(second);
    });

    it("prepends a new repo on an update event", () => {
        const existing = makeActivity("https://github.com/user/repo-a");
        const incoming = makeActivity("https://github.com/user/repo-b");
        const { result } = renderHook(() => useGithubActivity());
        act(() => { sendMessage({ type: "initial", data: [existing] }); });
        act(() => { sendMessage({ type: "update", data: incoming }); });
        expect(result.current.items[0]).toEqual(incoming);
        expect(result.current.items[1]).toEqual(existing);
    });

    it("deduplicates by repository URL on update — replaces existing entry", () => {
        const v1 = makeActivity("https://github.com/user/repo-a", "sha-v1");
        const v2 = makeActivity("https://github.com/user/repo-a", "sha-v2");
        const other = makeActivity("https://github.com/user/repo-b");
        const { result } = renderHook(() => useGithubActivity());
        act(() => { sendMessage({ type: "initial", data: [v1, other] }); });
        act(() => { sendMessage({ type: "update", data: v2 }); });
        expect(result.current.items).toHaveLength(2);
        expect(result.current.items[0]?.commit.sha).toBe("sha-v2");
        expect(result.current.items[1]).toEqual(other);
    });

    it("orders by push time when a poll emits several updates out of order", () => {
        // Updates within one poll arrive newest-first; the older push (repo-b)
        // is emitted last. The list must still end up sorted newest-first.
        const base = makeActivity(
            "https://github.com/user/repo-a",
            "sha-a",
            "2024-01-01T00:00:00.000Z",
        );
        const newer = makeActivity(
            "https://github.com/user/repo-c",
            "sha-c",
            "2024-03-01T00:00:00.000Z",
        );
        const older = makeActivity(
            "https://github.com/user/repo-b",
            "sha-b",
            "2024-02-01T00:00:00.000Z",
        );
        const { result } = renderHook(() => useGithubActivity());
        act(() => { sendMessage({ type: "initial", data: [base] }); });
        act(() => { sendMessage({ type: "update", data: newer }); });
        act(() => { sendMessage({ type: "update", data: older }); });
        expect(result.current.items.map((i) => i.repository.url)).toEqual([
            "https://github.com/user/repo-c",
            "https://github.com/user/repo-b",
            "https://github.com/user/repo-a",
        ]);
    });

    it("caps the list at 5 items after an update", () => {
        const existing = Array.from({ length: 5 }, (_, i) =>
            makeActivity(`https://github.com/user/repo-${i}`)
        );
        const incoming = makeActivity("https://github.com/user/repo-new");
        const { result } = renderHook(() => useGithubActivity());
        act(() => { sendMessage({ type: "initial", data: existing }); });
        act(() => { sendMessage({ type: "update", data: incoming }); });
        expect(result.current.items).toHaveLength(5);
        expect(result.current.items[0]).toEqual(incoming);
    });

    it("sets error status and message from a server-side error event", () => {
        const { result } = renderHook(() => useGithubActivity());
        act(() => { sendMessage({ type: "error", data: { message: "rate limited" } }); });
        expect(result.current.connectionStatus).toBe("error");
        expect(result.current.error).toBe("rate limited");
    });

    it("calls wrapUpdate for update events and applies the state change", () => {
        const wrapUpdate = vi.fn((fn: () => void) => fn());
        const existing = makeActivity("https://github.com/user/repo-a");
        const incoming = makeActivity("https://github.com/user/repo-b");
        const { result } = renderHook(() => useGithubActivity({ wrapUpdate }));
        act(() => { sendMessage({ type: "initial", data: [existing] }); });
        act(() => { sendMessage({ type: "update", data: incoming }); });
        expect(wrapUpdate).toHaveBeenCalledOnce();
        expect(result.current.items[0]).toEqual(incoming);
    });

    it("does not call wrapUpdate for initial or error events", () => {
        const wrapUpdate = vi.fn((fn: () => void) => fn());
        renderHook(() => useGithubActivity({ wrapUpdate }));
        act(() => {
            sendMessage({ type: "initial", data: [makeActivity("https://github.com/user/repo-a")] });
            sendMessage({ type: "error", data: { message: "oops" } });
        });
        expect(wrapUpdate).not.toHaveBeenCalled();
    });

    it("closes the EventSource on unmount", () => {
        const { unmount } = renderHook(() => useGithubActivity());
        unmount();
        expect(mockEs.close).toHaveBeenCalledOnce();
    });
});
