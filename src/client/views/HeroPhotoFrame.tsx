import styles from './HeroPhotoFrame.module.css';

export const HeroPhotoFrame = () => {
    return (
        <div className={styles.view}>
            <div className={styles.photoRing}>
                <div className={styles.photoFrame}>
                    <div className={styles.photoWrapper}>
                        <div className={styles.photoInner}>
                            <img alt="" className={styles.photo} src="/hero-photo.png" />
                        </div>
                    </div>
                </div>

                <div className={styles.infoPills}>
                    <div className={`${styles.infoPill} ${styles.pillStreets}`} style={{ '--pill-index': 0 } as React.CSSProperties} data-pill="streets">
                        <div aria-hidden className={styles.infoPillBg} />
                        <div className={styles.infoPillEmoji}>🚲</div>
                        <p className={styles.infoPillTitle}>Safe Streets Halton</p>
                        <p className={styles.infoPillSubtitle}>President</p>
                        <div aria-hidden className={styles.infoPillInset} />
                    </div>
                    <div className={`${styles.infoPill} ${styles.infoPillLg} ${styles.pillPokemon}`} style={{ '--pill-index': 1 } as React.CSSProperties} data-pill="pokemon">
                        <div aria-hidden className={styles.infoPillBg} />
                        <div className={styles.infoPillEmoji}>🃏</div>
                        <p className={styles.infoPillTitle}>Pokémon TCG</p>
                        <p className={styles.infoPillSubtitle}>Deck builder</p>
                        <div aria-hidden className={styles.infoPillInset} />
                    </div>
                    <div className={`${styles.infoPill} ${styles.pillCities}`} style={{ '--pill-index': 2 } as React.CSSProperties} data-pill="cities">
                        <div aria-hidden className={styles.infoPillBg} />
                        <div className={styles.infoPillEmoji}>🏙️</div>
                        <p className={styles.infoPillTitle}>Cities: Skylines 2</p>
                        <p className={styles.infoPillSubtitle}>Off the clock</p>
                        <div aria-hidden className={styles.infoPillInset} />
                    </div>
                    <div className={`${styles.infoPill} ${styles.infoPillLg} ${styles.pillCycling}`} style={{ '--pill-index': 3 } as React.CSSProperties} data-pill="cycling">
                        <div aria-hidden className={styles.infoPillBg} />
                        <div className={styles.infoPillEmoji}>🚴</div>
                        <p className={styles.infoPillTitle}>Cycling</p>
                        <p className={styles.infoPillSubtitle}>Burlington trails</p>
                        <div aria-hidden className={styles.infoPillInset} />
                    </div>
                </div>
            </div>

            <div className={styles.locationPill}>
                <div aria-hidden className={styles.locationPillBg} />
                <div className={styles.locationDotWrapper}>
                    <div className={styles.locationDotInner}>
                        <img alt="" className={styles.locationDotImg} src="/location-dot.svg" />
                    </div>
                </div>
                <p className={styles.locationText}>Burlington, Ontario 🇨🇦</p>
                <div aria-hidden className={styles.locationPillInset} />
            </div>
        </div>
    );
};
