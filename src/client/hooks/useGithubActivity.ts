import type {
    GithubActivityData,
    GithubActivityEvent,
} from "@common/GithubActivityEvent";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../util/config";

/**
 * Custom hook to fetch and manage GitHub activity data.
 * @returns An object containing the GitHub activity data, the connection status, and any error message.
 */
export const useGithubActivity: (options?: { wrapUpdate?: (update: () => void) => void }) => {
    items: GithubActivityData[];
    connectionStatus: "initializing" | "connected" | "error" | "closed";
    error: string | undefined;
} = (options) => { 
    const [connectionStatus, setConnectionStatus] = useState<
        "initializing" | "connected" | "error" | "closed"
    >("initializing");
    const [activity, setActivity] = useState<GithubActivityData[]>([]);
    const [error, setError] = useState<string | undefined>(undefined);
    useEffect(() => {
        const es = new EventSource(`${API_BASE_URL}/github/activity`);        
        es.onerror = (error) => {
            console.debug("Error connecting to GitHub activity stream:", error);
            setConnectionStatus("error");
            setError("An error occurred connecting to the Activity Stream. \n Please check your internet connection.");
        };
        es.onopen = () => {
            console.debug("Connected to GitHub activity stream");
            setConnectionStatus("connected");
        };
        es.onmessage = (event) => {
            console.debug("Received GitHub activity:", event.data);
            // You can add logic here to update your application's state based on the received data.
            try {
                const payload = JSON.parse(event.data) as GithubActivityEvent;
                if (payload.type === "initial") {
                    setActivity(payload.data);
                } else if (payload.type === "update") {
                    const applyUpdate = () => {
                        setActivity((prev) =>
                            [
                                payload.data,
                                ...prev.filter((item) =>
                                    item.repository.url !== payload.data.repository.url
                                ),
                            ]
                                // Order by push time rather than arrival order: a single poll
                                // can emit several updates in one tick (newest-first), and naive
                                // prepending would leave the oldest of that batch on top.
                                .sort((a, b) =>
                                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                                )
                                .slice(0, 5)
                        );
                    };
                    if (options?.wrapUpdate) {
                        options.wrapUpdate(applyUpdate);
                    } else {
                        applyUpdate();
                    }
                } else if (payload.type === "error") {
                    setError(payload.data.message);
                    setConnectionStatus("error");
                } else {
                    console.warn("Received unknown event type from GitHub activity stream:", payload);
                    setError("Received unexpected event from GitHub activity stream");
                    setConnectionStatus("error");
                }
            } catch (e) {
                console.error("Failed to parse GitHub activity event data:", e);
                setError("Failed to parse data from GitHub activity stream");
                setConnectionStatus("error");
            }
        };
        return () => {
            es.close();
            console.debug("Closed connection to GitHub activity stream");
        };
    }, []);
    return { items: activity, connectionStatus, error };
};
