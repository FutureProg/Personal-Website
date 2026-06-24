import { GithubActivityView } from "../../views/GithubActivityView";
import { HeroPhotoFrame } from "../../views/HeroPhotoFrame";
import styles from "../../App.module.css";
import SiteIcon from "../../images/icon.png";

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
            <span className="subtitle">
              Full Stack Software Developer — Burlington, ON
            </span>
            <div className={styles.bio}>
              I'm a full stack developer with a decade across the stack.{" "}
              <strong>
                I care as much about creating a good user's experience as having
                good code behind it
              </strong>, because long-term, you can't have one without the
              other.
            </div>
          </div>
          <HeroPhotoFrame className={styles.heroPhotoFrame} />
        </section>
        <section className={styles.whoIAmSection}>
          <div className={styles.sectionHeader}>
            <div className="subtitle">AT A GLANCE</div>
            <h1>
              Who I <span className="brand-gradient-text">am</span>
            </h1>
          </div>
          <GithubActivityView className={styles.githubActivityView} />
          <div className={`${styles.howIThink} ${styles.bento}`}>
            <h2>My Approach</h2>
            <ol>
              <li>
                <span>
                  <strong>The interface is the product</strong>
                  <p>
                    Most users never see the architecture. They see the loading
                    state, the error message, the transition. That's where
                    quality is felt.
                  </p>
                </span>
              </li>
              <li>
                <span>
                  <strong>
                    Design and engineering belong in the same conversation
                  </strong>
                  <p>
                    I work from Figma early and often. Constraints surface
                    faster, and the code ends up more composable for it.
                  </p>
                </span>
              </li>
              <li>
                <span>
                  <strong>Good teams ship better products</strong>
                  <p>
                    The best frontend work I've done came out of tight loops
                    with designers and clear handoffs with backend. Shared
                    context is a multiplier.
                  </p>
                </span>
              </li>
            </ol>
          </div>
        </section>
      </main>
    </>
  );
}
