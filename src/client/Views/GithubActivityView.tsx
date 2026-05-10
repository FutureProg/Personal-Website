import styles from './GithubActivityView.module.css';
import { StatusToken, type StatusTokenStatus } from '../components/StatusToken';
import { GithubActivityRow, type GithubActivityRowProps } from '../components/GithubActivityRow';
import { useGithubActivity } from '../hooks/useGithubActivity';

export interface GithubActivityViewProps {
    status: StatusTokenStatus;
    repositories: GithubActivityRowProps[];
}

export const GithubActivityView = () => {
    const githubActivity = useGithubActivity();

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
    ) : <div className={styles.emptyState}>{githubActivity.connectionStatus === 'error'? 'Github activity is not available...': 'No recent activity'}</div>;

    let connectionStatus: StatusTokenStatus = 'offline';
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
            connectionStatus = 'offline';
            break;
    }
    return (
        <div className={styles.view}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h2 className={styles.title}>Github Activity</h2>
                    <StatusToken status={connectionStatus} />
                </div>
                <p className={styles.subtitle}>5 Most Recent Github Repositories with commits</p>
            </div>
            {content}
        </div>
    );
};
