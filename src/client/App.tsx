import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GithubActivityView } from "./views/GithubActivityView";
import { WritingPostPage } from "./views/WritingPostPage";
import { WorkItemPage } from "./views/WorkItemPage";
import styles from "./App.module.css";
import { HeroPhotoFrame } from "./views/HeroPhotoFrame";
import SiteIcon from './images/icon.png';

const HomePage = () => (
    <>
        <header>
            <img
                src={SiteIcon}
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
                    <div className={styles.bio}>
                        I'm a full stack developer with a decade across the stack. <strong>I care as much about creating a good user's experience
                        as having good code behind it</strong>, because long-term, you can't have one without the other.
                    </div>
                </div>
                <HeroPhotoFrame className={styles.heroPhotoFrame} />
            </section>
            <section className="github-activity">
                <GithubActivityView />
            </section>
        </main>
    </>
);

export const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/writing/:slug" element={<WritingPostPage />} />
            <Route path="/work/:slug" element={<WorkItemPage />} />
        </Routes>
    </BrowserRouter>
);
