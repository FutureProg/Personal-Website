export type GithubActivityEvent = GithubActivityInitialEvent | GithubActivityUpdateEvent | GithubActivityErrorEvent;

export interface GithubActivityInitialEvent {
    type: "initial";
    data: GithubActivityData[];
}

export interface GithubActivityErrorEvent {
    type: "error";
    data: {
        message: string;
    };
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
    };
    timestamp: string;
};