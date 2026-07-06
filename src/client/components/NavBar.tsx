import SiteIcon from "../images/icon.png";
import styles from './NavBar.module.css';

export const NavBar = () => {
  return (
    <header className={styles.siteHeader}>
      <img
        src={SiteIcon}
        alt="website logo, a butterfly with the wings spelling N and M"
      />
    </header>
  );
};

export type NavBarProps = {};