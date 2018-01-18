// setup instruments component
import React from 'react'

import Page from '../components/Page'
import ConnectedTipProbe from '../containers/ConnectedTipProbe'
import {InstrumentTabs, Instruments} from '../components/setup-instruments'

import SessionHeader from '../containers/SessionHeader'

const PAGE_TITLE = 'Setup Instruments'

export default function SetupInstrumentsPage (props) {
  const {match} = props
  const mount = match.params.mount

  return (
    <Page>
      <SessionHeader subtitle={PAGE_TITLE} />
      <InstrumentTabs mount={mount} />
      <Instruments mount={mount} />
      <ConnectedTipProbe mount={mount} />
    </Page>
  )
}
