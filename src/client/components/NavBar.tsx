import { useState, type CSSProperties } from 'react';
import SiteIcon from '../images/icon.png';
import GithubIcon from '../images/github-icon.svg';
import LinkedInIcon from '../images/linkedin-icon.svg';
import MenuIcon from '../images/menu-icon.svg';
import { IconButton } from './IconButton';
import { NavDrawer } from './NavDrawer';
import styles from './NavBar.module.css';

const iconMaskStyle = (icon: string): CSSProperties => ({ '--icon-url': `url("${icon}")` } as CSSProperties);

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

const NavLinks = ({ pageLinks, cta }: NavBarProps) => (
  <>
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
        aria-label={social.label}
      >
        <span className={styles.socialIcon} style={iconMaskStyle(social.icon)} />
      </a>
    ))}
    {cta && (
      <a className={styles.cta} href={cta.href}>
        {cta.label}
      </a>
    )}
  </>
);

export const NavBar = ({ pageLinks, cta }: NavBarProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className={styles.siteHeader}>
      <a className={styles.logo} href="/">
        <img
          src={SiteIcon}
          alt="website logo, a butterfly with the wings spelling N and M"
        />
      </a>
      <nav className={styles.nav}>
        <NavLinks pageLinks={pageLinks} cta={cta} />
      </nav>
      <span className={styles.mobileTrigger}>
        <IconButton
          icon={<span className={styles.menuIcon} style={iconMaskStyle(MenuIcon)} />}
          label="Open menu"
          onClick={() => setDrawerOpen(true)}
        />
      </span>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} label="Site navigation">
        <nav className={styles.drawerNav}>
          <NavLinks pageLinks={pageLinks} cta={cta} />
        </nav>
      </NavDrawer>
    </header>
  );
};
