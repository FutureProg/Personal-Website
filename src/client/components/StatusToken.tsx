import styles from './StatusToken.module.css';

export type StatusTokenStatus = 'live' | 'offline';

export interface StatusTokenProps {
    status: StatusTokenStatus;
}

export const StatusToken = ({ status }: StatusTokenProps) => {
    return (
        <div className={`${styles.statusToken} ${styles[status]}`}>
            <span className={styles.label}>{status.toUpperCase()}</span>
            <div className={styles.dot} />
        </div>
    );
};
