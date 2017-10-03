// setup instruments component
import React from 'react'
import Header from '../components/Header'
import Page from '../components/Page'

export default function SetupDeckPage () {
  return (
    <Page>
      <Header />
      <ConnectedDeckConfig />
    </Page>
  )
}
