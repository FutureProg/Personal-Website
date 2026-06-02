import styles from './HeroInfoPill.module.css';

export interface HeroInfoPillProps {
    emoji: string;
    title: string;
    subtitle: string;
    expanded?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export const HeroInfoPill = ({ emoji, title, subtitle, expanded, className, style }: HeroInfoPillProps) => {
    const classes = [styles.pill, expanded && styles.expanded, className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} style={style}>
            <div aria-hidden className={styles.pillBg} />
            <div className={styles.pillEmoji}>{emoji}</div>
            <div className={styles.pillTextContainer}>
                <p className={styles.pillTitle}>{title}</p>
                <p className={styles.pillSubtitle}>{subtitle}</p>
                <div aria-hidden className={styles.pillInset} />
            </div>            
        </div>
    );
};
