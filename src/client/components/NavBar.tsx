import SiteIcon from "../images/icon.png";
import GithubIcon from "../images/github-icon.svg";
import LinkedInIcon from "../images/linkedin-icon.svg";
import styles from './NavBar.module.css';

export type NavLink = {
  label: string;
  href: string;
};

export type NavBarProps = {
  pageLinks: NavLink[];
  cta?: NavLink | undefined;
};

const SOCIAL_LINKS = [
  { label: 'Github', href: 'https://github.com/futureprog', icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/nickolasmorrison', icon: LinkedInIcon },
];

export const NavBar = ({ pageLinks, cta }: NavBarProps) => {
  return (
    <header className={styles.siteHeader}>
      <img
        className={styles.logo}
        src={SiteIcon}
        alt="website logo, a butterfly with the wings spelling N and M"
      />
      <nav className={styles.nav}>
        {pageLinks.map((link) => (
          <a key={link.href} className={styles.pageLink} href={link.href}>
            {link.label}
          </a>
        ))}
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.href}
            className={styles.socialLink}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={social.icon} alt={social.label} />
          </a>
        ))}
        {cta && (
          <a className={styles.cta} href={cta.href}>
            {cta.label}
          </a>
        )}
      </nav>
    </header>
  );
};
