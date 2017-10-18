// setup instruments component
import React from 'react'
import Page from '../components/Page'
import SessionHeader from '../containers/SessionHeader'
import ConnectedPipetteConfig from '../containers/ConnectedPipetteConfig'

const DEFAULT_SIDE = 'left'

export default function SetupInstrumentsPage (props) {
  const {match} = props
  const side = match.params.side || DEFAULT_SIDE
  return (
    <Page>
      <SessionHeader />
      <ConnectedPipetteConfig side={side} />
    </Page>
  )
}
