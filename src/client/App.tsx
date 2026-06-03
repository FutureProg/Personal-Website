import { GithubActivityView } from "./views/GithubActivityView";
import styles from "./app.module.css";
import { HeroPhotoFrame } from "./views/HeroPhotoFrame";

export const App = () => {
    return (
        <>
            <header>
                <img
                    src="/images/icon.png"
                    alt="website logo, a butterfly with the wings spelling N and M"
                />
            </header>

            <main>
                <section className={styles.hero}>
                    <div className={styles.intro}>
                        <h1>
                            Nick<br/>
                            <span className={styles.lastName}>Morrison</span>
                        </h1>
                        <span className='subtitle'>Full Stack Software Developer — Burlington, ON</span>
                        <div>
                            I'm a full stack developer with a decade across the stack. <strong>I care as much about creating a good user's experience 
                            as having good code behind it</strong>, because long-term, you can't have one without the other.
                        </div>
                    </div>
                    <HeroPhotoFrame />
                </section>
                <section className="github-activity">
                    <GithubActivityView />
                </section>
            </main>            
        </>
    );
};
