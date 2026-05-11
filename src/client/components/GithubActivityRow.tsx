import styles from './GithubActivityRow.module.css';

export interface GithubActivityRowProps {
    repositoryName: string;
    repositoryUrl: string;
    commitId: string;
    commitUrl: string;
    /** ISO 8601 date-time string as returned by the GitHub API */
    commitTimestamp: string;
}

// Reusable formatter for better performance
// Uses the user's locale for formatting
const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    timeZoneName: 'short',
});

function formatTimestamp(isoString: string): string {
    // Use Temporal API if available (Chrome 144+, Firefox 139+, Edge 144+)
    if (typeof Temporal !== 'undefined') {
        // Parse as Instant - Temporal handles timezone-aware parsing
        const instant = Temporal.Instant.from(isoString);
        
        // Format the Instant directly (Intl.DateTimeFormat supports Temporal.Instant)
        const parts = dateFormatter.formatToParts(instant as any);
        
        // Reconstruct the formatted string from parts, handling dayPeriod lowercase
        return parts.map(part => {
            if (part.type === 'dayPeriod') {
                return part.value.toLowerCase();
            }
            return part.value;
        }).join('');
    }
    
    // Fallback to Date for browsers without Temporal support
    const date = new Date(isoString);
    const parts = dateFormatter.formatToParts(date);

    // Reconstruct the formatted string from parts, handling dayPeriod lowercase
    return parts.map(part => {
        if (part.type === 'dayPeriod') {
            return part.value.toLowerCase();
        }
        return part.value;
    }).join('');
}

function toViewTransitionName(url: string): string {
    return 'github-row-' + url.replace(/[^a-zA-Z0-9]/g, '-');
}

export const GithubActivityRow = ({
    repositoryName,
    repositoryUrl,
    commitId,
    commitUrl,
    commitTimestamp,
}: GithubActivityRowProps) => {
    return (
        <div className={styles.row} style={{ viewTransitionName: toViewTransitionName(repositoryUrl) }}>
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
            <time className={styles.timestamp} dateTime={commitTimestamp}>{formatTimestamp(commitTimestamp)}</time>
        </div>
    );
};
