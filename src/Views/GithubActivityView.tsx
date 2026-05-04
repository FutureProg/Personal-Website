import styles from './GithubActivityView.module.css';
import { StatusToken, type StatusTokenStatus } from '../components/StatusToken';
import { GithubActivityRow, type GithubActivityRowProps } from '../components/GithubActivityRow';

export interface GithubActivityViewProps {
    status: StatusTokenStatus;
    repositories: GithubActivityRowProps[];
}

export const GithubActivityView = ({ status, repositories }: GithubActivityViewProps) => {
    return (
        <div className={styles.view}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h2 className={styles.title}>Github Activity</h2>
                    <StatusToken status={status} />
                </div>
                <p className={styles.subtitle}>5 Most Recent Github Repositories with commits</p>
            </div>
            <div className={styles.rows}>
                {repositories.map((repo) => (
                    <GithubActivityRow key={repo.repositoryUrl} {...repo} />
                ))}
            </div>
        </div>
    );
};
