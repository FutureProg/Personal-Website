import React from 'react'
import '../styles/index.css'
import '../styles/App.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
