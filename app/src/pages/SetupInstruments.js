// @flow
// setup instruments component
import React from 'react'
import {Route} from 'react-router'

import type {Mount} from '../robot'

import Page from '../components/Page'
import TipProbe from '../components/TipProbe'
import ContinueTipProbeModal from '../components/ContinueTipProbeModal'
import {InstrumentTabs, Instruments} from '../components/setup-instruments'

import SessionHeader from '../containers/SessionHeader'

const PAGE_TITLE = 'Setup Instruments'

type Props = {
  match: {
    url: string,
    params: {
      mount: Mount
    }
  }
}

export default function SetupInstrumentsPage (props: Props) {
  const {match: {url, params: {mount}}} = props
  const confirmTipProbeUrl = `${url}/confirm-tip-probe`

  console.log('MOUNT', mount)

  return (
    <Page>
      <SessionHeader subtitle={PAGE_TITLE} />
      <InstrumentTabs mount={mount} />
      <Instruments mount={mount} />
      <TipProbe mount={mount} confirmTipProbeUrl={confirmTipProbeUrl} />
      <Route path={confirmTipProbeUrl} render={() => (
        <ContinueTipProbeModal mount={mount} backUrl={url} />
      )} />
    </Page>
  )
}
