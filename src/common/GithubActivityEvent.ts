export type GithubActivityEvent = GithubActivityInitialEvent | GithubActivityUpdateEvent | GithubActivityErrorEvent | GithubActivityCloseEvent;

export interface GithubActivityInitialEvent {
    type: "initial";
    data: GithubActivityData[];
}

export interface GithubActivityCloseEvent {
    type: "closed";
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