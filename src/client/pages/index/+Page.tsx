import { GithubActivityView } from "../../views/GithubActivityView";
import { HeroPhotoFrame } from "../../views/HeroPhotoFrame";
import styles from "../../App.module.css";
import SiteIcon from "../../images/icon.png";
import { Badge } from "../../components/Badge";
import skillsList from "./skillsList";

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
          <div className={`${styles.howIWork} ${styles.bento}`}>
            <h2>How I work</h2>
            <ol>
              <li>
                  <h3>Pragmatism over novelty</h3>
                  <p>
                    New tools are worth exploring, but production decisions have long-term consequences. Good tests, automated pipelines, and reliable choices are what let teams move fast without breaking things.
                  </p>
              </li>
              <li>
                  <h3>
                    A team that learns together
                  </h3>
                  <p>
                    Keeping up with the industry is a dev's responsibility. But knowledge only grows when it spreads. Sharing what you learn — in a PR, a retro, a Slack thread — lifts everyone's floor.
                  </p>
              </li>
              <li>
                  <h3>Good environments make good products</h3>
                  <p>
                    I care about rooms where everyone gets heard. Sticky notes on a wall beat a loud voice in a meeting. When people feel safe enough to be honest, you catch problems earlier, and the work gets better.
                  </p>
              </li>
            </ol>
          </div>
          <div className={`${styles.bento} ${styles.skillsBento}`}>
            <h2>Current Stack</h2>
            <div className={styles.skillBadges}>
              {skillsList.map((skill) => (
                <Badge key={skill.name} icon={skill.icon}>{skill.name}</Badge>
              ))}              
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
