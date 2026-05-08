export type GithubActivityEvent = GithubActivityInitialEvent | GithubActivityUpdateEvent;

export interface GithubActivityInitialEvent {
    type: "initial";
    data: GithubActivityData[];
}

export interface GithubActivityUpdateEvent {
    type: "update";
    data: GithubActivityData;
}

export type GithubActivityData = {
    repository: {
        name: string;
        url: string;
    };
    commit: {
        sha: string;
        message: string;
        url: string;
    }
    timestamp: string;
};