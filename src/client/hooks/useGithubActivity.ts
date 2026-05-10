import type {
    GithubActivityData,
    GithubActivityEvent,
} from "@common/GithubActivityEvent";
import { useEffect, useState } from "react";

/**
 * Custom hook to fetch and manage GitHub activity data.
 * @returns An object containing the GitHub activity data and the connection status.
 */
export const useGithubActivity: (options?: { wrapUpdate?: (update: () => void) => void }) => {
    items: GithubActivityData[];
    connectionStatus: "initializing" | "connected" | "error" | "closed";
} = (options) => {
    const [connectionStatus, setConnectionStatus] = useState<
        "initializing" | "connected" | "error" | "closed"
    >("initializing");
    const [activity, setActivity] = useState<GithubActivityData[]>([]);
    useEffect(() => {
        const es = new EventSource("/api/github/activity");        
        es.onerror = (error) => {
            console.debug("Error connecting to GitHub activity stream:", error);
            setConnectionStatus("error");
        };
        es.onopen = () => {
            console.debug("Connected to GitHub activity stream");
            setConnectionStatus("connected");
        };
        es.onmessage = (event) => {
            console.debug("Received GitHub activity:", event.data);
            // You can add logic here to update your application's state based on the received data.
            const payload = JSON.parse(event.data) as GithubActivityEvent;
            if (payload.type === "initial") {
                setActivity(payload.data);
            } else if (payload.type === "update") {
                const applyUpdate = () => {
                    setActivity((prev) => [
                        payload.data,
                        ...prev.filter((item) =>
                            item.repository.url !== payload.data.repository.url
                        ),
                    ].slice(0, 5));
                };
                if (options?.wrapUpdate) {
                    options.wrapUpdate(applyUpdate);
                } else {
                    applyUpdate();
                }
            }
        };
        return () => {
            es.close();
            console.debug("Closed connection to GitHub activity stream");
            setConnectionStatus("closed");
        };
    }, []);
    return { items: activity, connectionStatus };
};
