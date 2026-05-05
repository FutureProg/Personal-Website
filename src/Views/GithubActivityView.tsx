import styles from './GithubActivityView.module.css';
import { StatusToken, type StatusTokenStatus } from '../components/StatusToken';
import { GithubActivityRow, type GithubActivityRowProps } from '../components/GithubActivityRow';

export interface GithubActivityViewProps {
    status: StatusTokenStatus;
    repositories: GithubActivityRowProps[];
}

export const GithubActivityView = ({ status, repositories }: GithubActivityViewProps) => {

    const content = repositories.length > 0 ? (
        <div className={styles.rows}>
            {repositories.map((repo) => (
                <GithubActivityRow key={repo.repositoryUrl} {...repo} />
            ))}
        </div>
    ) : <div className={styles.emptyState}>{status === 'offline'? 'Github activity is not available...': 'No recent activity'}</div>;

    return (
        <div className={styles.view}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h2 className={styles.title}>Github Activity</h2>
                    <StatusToken status={status} />
                </div>
                <p className={styles.subtitle}>5 Most Recent Github Repositories with commits</p>
            </div>
            {content}
        </div>
    );
};
