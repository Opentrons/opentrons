// setup instruments component
import React from 'react'
import Header from '../components/Header'
import Page from '../components/Page'
import PipetteConfig from '../components/PipetteConfig'

const DEFAULT_SIDE = 'left'

export default function SetupInstrumentsPage (props) {
  const {match} = props
  const side = match.params.side || DEFAULT_SIDE

  return (
    <Page>
      <Header />
      <PipetteConfig side={side} />
    </Page>
  )
}
