// setup instruments component
import React from 'react'

import Page from '../components/Page'
import {InstrumentTabs} from '../components/setup-instruments'

import SessionHeader from '../containers/SessionHeader'
import ConnectedPipetteConfig from '../containers/ConnectedPipetteConfig'

const PAGE_TITLE = 'Setup Instruments'
const DEFAULT_SIDE = 'left'

export default function SetupInstrumentsPage (props) {
  const {match} = props
  const side = match.params.side || DEFAULT_SIDE

  return (
    <Page>
      <SessionHeader subtitle={PAGE_TITLE} />
      <InstrumentTabs side={side} />
      <ConnectedPipetteConfig side={side} />
    </Page>
  )
}
