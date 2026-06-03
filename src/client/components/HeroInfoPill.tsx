import styles from './HeroInfoPill.module.css';

export interface HeroInfoPillProps {
    icon: string | React.ReactNode;
    title: string;
    subtitle: string;
    expanded?: boolean;
    href?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const HeroInfoPill = ({ icon, title, subtitle, expanded, href, className, style }: HeroInfoPillProps) => {
    const classes = [styles.pill, expanded && styles.expanded, href && styles.hasLink, className]
        .filter(Boolean)
        .join(' ');

    const Tag = (href ? 'a' : 'div');

    return (
        <Tag
            className={classes}
            style={style}
            {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
            <div aria-hidden className={styles.pillBg}>
                <div aria-hidden className={styles.pillInset} />
            </div>
            <div className={styles.pillEmoji}>{icon}</div>
            <div className={styles.pillTextContainer}>
                <p className={styles.pillTitle}>{title}</p>
                <p className={styles.pillSubtitle}>{subtitle}</p>                
            </div>

            {href && <div aria-hidden className={styles.pillArrow}>→</div>}
        </Tag>
    );
};
