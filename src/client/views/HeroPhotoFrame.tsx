import { useEffect, useRef, useState } from 'react';
import { HeroInfoPill } from '../components/HeroInfoPill';
import styles from './HeroPhotoFrame.module.css';

import SafeStreetsIcon from '../images/safe-streets-halton.svg';
import PokeballIcon from '../images/pokeball-icon.svg';
import Cities2Logo from '../images/cs2-logo.png'

export const HeroPhotoFrame = () => {
    const viewRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const rateRef = useRef(1);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const el = viewRef.current;
        if (!el) return;
        const breakpoint = parseFloat(
            getComputedStyle(el).getPropertyValue('--hero-frame-mobile-breakpoint')
        ) || 479;
        const observer = new ResizeObserver(([entry]) => {
            if (!entry) return;
            setIsMobile(entry.contentRect.width <= breakpoint);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
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
                    <HeroInfoPill
                        icon={<img alt="Safe Streets Halton's Logo" src={SafeStreetsIcon} className={styles.streetsIcon} />}
                        title="Safe Streets Halton"
                        subtitle="Founder & President"
                        expanded={isMobile}
                        href="https://safestreetshalton.ca"
                        className={`${styles.infoPill} ${styles.pillStreets}`}
                        style={{ '--pill-index': 0 } as React.CSSProperties}
                    />
                    <HeroInfoPill
                        icon={<img alt="Pokeball Icon" src={PokeballIcon} className={styles.pokeballIcon} />}
                        title="Pokémon"
                        href="https://play.pokemon.com"
                        subtitle="TCG and Video Games"
                        expanded={isMobile}
                        className={`${styles.infoPill} ${styles.pillPokemon}`}
                        style={{ '--pill-index': 1 } as React.CSSProperties}
                    />
                    <HeroInfoPill
                        icon={<img alt="Cities: Skylines 2 Logo" src={Cities2Logo} className={styles.cities2Icon} />}
                        title="Cities: Skylines 2"
                        subtitle="Off the clock"
                        expanded={isMobile}
                        href="https://www.paradoxinteractive.com/games/cities-skylines-ii"
                        className={`${styles.infoPill} ${styles.pillCities}`}
                        style={{ '--pill-index': 2 } as React.CSSProperties}
                    />
                    <HeroInfoPill
                        icon="🚴"
                        title="Cycling"
                        subtitle="Burlington trails"
                        expanded={isMobile}
                        className={`${styles.infoPill} ${styles.pillCycling}`}
                        style={{ '--pill-index': 3 } as React.CSSProperties}
                    />
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
