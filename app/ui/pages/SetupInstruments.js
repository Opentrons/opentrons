// setup instruments component
import React from 'react'
import Header from '../components/Header'
import Page from '../components/Page'
import ConnectedPipetteConfig from '../containers/ConnectedPipetteConfig'
import ConnectedTipProbe from '../containers/ConnectedTipProbe'

export default function SetupInstrumentsPage (props) {
  return (
    <Page>
      <Header />
      <ConnectedPipetteConfig />
      <ConnectedTipProbe />
    </Page>
  )
}
