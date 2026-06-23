import { GithubActivityView } from "../../views/GithubActivityView";
import { HeroPhotoFrame } from "../../views/HeroPhotoFrame";
import styles from "../../App.module.css";
import SiteIcon from '../../images/icon.png';

export default function Page() {
  return (
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
            <div className="site-title">
              Nick<br />
              <span className={styles.lastName}>Morrison</span>
            </div>
            <span className='subtitle'>Full Stack Software Developer — Burlington, ON</span>
            <div className={styles.bio}>
              I'm a full stack developer with a decade across the stack. <strong>I care as much about creating a good user's experience
              as having good code behind it</strong>, because long-term, you can't have one without the other.
            </div>
          </div>
          <HeroPhotoFrame className={styles.heroPhotoFrame} />
        </section>
        <section className={styles.whoIAmSection}>
          <div className={styles.sectionHeader}>
            <div className="subtitle">AT A GLANCE</div>
            <h1>Who I <span className="brand-gradient-text">am</span></h1>
          </div>          
          <GithubActivityView className={styles.githubActivityView} />
        </section>
      </main>
    </>
  )
}
