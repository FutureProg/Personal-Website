import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import { NavBar } from '../components/NavBar'
import '../styles/index.css'
import '../styles/App.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pageContext = usePageContext()
  const { navLinks, navCta } = pageContext.config

  return (
    <>
      <NavBar pageLinks={navLinks ?? []} cta={navCta} />
      {children}
    </>
  )
}
