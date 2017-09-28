// setup instruments component
import React from 'react'
import Header from '../components/Header'
import Page from '../components/Page'
import ConnectedPipetteConfig from '../containers/ConnectedPipetteConfig'

const DEFAULT_SIDE = 'left'

export default function SetupInstrumentsPage (props) {
  const {match} = props
  const side = match.params.side || DEFAULT_SIDE

  return (
    <Page>
      <Header />
      <ConnectedPipetteConfig side={side} />
    </Page>
  )
}
