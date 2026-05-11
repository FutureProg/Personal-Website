import styles from './GithubActivityView.module.css';
import { StatusToken, type StatusTokenStatus } from '../components/StatusToken';
import { GithubActivityRow, type GithubActivityRowProps } from '../components/GithubActivityRow';
import { useGithubActivity } from '../hooks/useGithubActivity';
import { flushSync } from 'react-dom';

export interface GithubActivityViewProps {
    status: StatusTokenStatus;
    repositories: GithubActivityRowProps[];
}

function wrapUpdate(update: () => void) {
    const doUpdate = () => flushSync(update);
    if (document.startViewTransition) {
        document.startViewTransition(doUpdate);
    } else {
        doUpdate();
    }
}

export const GithubActivityView = () => {
    const githubActivity = useGithubActivity({ wrapUpdate });

    let connectionStatus: StatusTokenStatus = 'offline';
    let messageText: string | null = null;
    switch(githubActivity.connectionStatus) {
        case 'initializing':
            connectionStatus = 'offline';
            break;
        case 'connected':
            connectionStatus = 'online';
            break;
        case 'closed':
            connectionStatus = 'offline';
            break;
        case 'error':
            connectionStatus = 'error';
            messageText = githubActivity.error || 'An error occurred connecting to the Github Activity Stream';
            break;
    }

    const content = githubActivity.items.length > 0 ? (
        <div className={styles.rows}>
            {githubActivity.items.map((repo) => (
                <GithubActivityRow
                    key={repo.repository.url}
                    repositoryName={repo.repository.name}
                    repositoryUrl={repo.repository.url}
                    commitId={repo.commit.sha}
                    commitUrl={repo.commit.url}
                    commitTimestamp={repo.timestamp}
                />
            ))}
        </div>
    ) : <div className={styles.statusMessage}>{messageText || 'No recent activity'}</div>;
    
    return (
        <div className={styles.view}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h2 className={styles.title}>GitHub Activity</h2>
                    <StatusToken status={connectionStatus} />
                </div>
                <p className={styles.subtitle}>5 Most Recent GitHub Repositories with commits</p>
            </div>
            {content}
        </div>
    );
};
