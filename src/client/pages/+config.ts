import vikeReact from 'vike-react/config'
import type { Config } from 'vike/types'
import type { NavLink } from '../components/NavBar'

declare global {
  namespace Vike {
    interface Config {
      navLinks?: NavLink[];
      navCta?: NavLink;
    }
  }
}

const config: Config = {
  extends: vikeReact,
  prerender: true,
  meta: {
    navLinks: {
      env: { server: true, client: true },
    },
    navCta: {
      env: { server: true, client: true },
    },
  },
}

export default config;
