import styles from './HeroInfoPill.module.css';

export interface HeroInfoPillProps {
    emoji: string;
    title: string;
    subtitle: string;
    size?: 'lg';
    className?: string;
    style?: React.CSSProperties;
}

export const HeroInfoPill = ({ emoji, title, subtitle, size, className, style }: HeroInfoPillProps) => {
    const classes = [styles.pill, size === 'lg' && styles.pillLg, className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} style={style}>
            <div aria-hidden className={styles.pillBg} />
            <div className={styles.pillEmoji}>{emoji}</div>
            <p className={styles.pillTitle}>{title}</p>
            <p className={styles.pillSubtitle}>{subtitle}</p>
            <div aria-hidden className={styles.pillInset} />
        </div>
    );
};
