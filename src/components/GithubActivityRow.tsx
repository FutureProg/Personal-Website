import styles from './GithubActivityRow.module.css';

export interface GithubActivityRowProps {
    repositoryName: string;
    repositoryUrl: string;
    commitId: string;
    commitUrl: string;
    /** ISO 8601 date-time string as returned by the GitHub API */
    commitTimestamp: string;
}

function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const parts = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        timeZoneName: 'short',
    }).formatToParts(date);

    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
    const dayPeriod = get('dayPeriod').toLowerCase();
    return `${get('month')} ${get('day')}, ${get('year')} ${get('hour')}${dayPeriod} ${get('timeZoneName')}`;
}

export const GithubActivityRow = ({
    repositoryName,
    repositoryUrl,
    commitId,
    commitUrl,
    commitTimestamp,
}: GithubActivityRowProps) => {
    return (
        <div className={styles.row}>
            <div className={styles.left}>
                <a
                    href={repositoryUrl}
                    className={styles.repoName}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {repositoryName}
                </a>
                <div className={styles.commitRow}>
                    <span className={styles.lastCommitLabel}>Last Commit</span>
                    <a
                        href={commitUrl}
                        className={styles.commitId}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {commitId.slice(0, 7)}
                    </a>
                </div>
            </div>
            <span className={styles.timestamp}>{formatTimestamp(commitTimestamp)}</span>
        </div>
    );
};
