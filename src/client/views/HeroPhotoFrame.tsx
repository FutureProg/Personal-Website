import { useRef } from 'react';
import styles from './HeroPhotoFrame.module.css';

export const HeroPhotoFrame = () => {
    const viewRef = useRef<HTMLDivElement>(null);
    const rateRef = useRef(1);
    const rafRef = useRef<number | null>(null);
    const slowAnimationDuration = 300; 

    const rampOrbitRate = (target: number) => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

        const anims = Array.from(
            viewRef.current?.querySelectorAll(`.${styles.infoPill}`) ?? []
        ).flatMap(pill => pill.getAnimations());

        const startRate = rateRef.current;
        const startTime = performance.now();

        const step = (now: number) => {
            const t = Math.min((now - startTime) / slowAnimationDuration, 1);
            const eased = t * t * (3 - 2 * t); // smoothstep
            const rate = startRate + (target - startRate) * eased;
            rateRef.current = rate;
            anims.forEach(anim => anim.updatePlaybackRate(rate));
            if (t < 1) rafRef.current = requestAnimationFrame(step);
            else rafRef.current = null;
        };

        rafRef.current = requestAnimationFrame(step);
    };

    return (
        <div
            className={styles.view}
            ref={viewRef}
            onMouseEnter={() => rampOrbitRate(0.4)}
            onMouseLeave={() => rampOrbitRate(1)}
        >
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
