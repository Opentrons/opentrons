// @flow
// setup instruments component
import React from 'react'
import {Route} from 'react-router'

import type {Mount} from '../robot'

import Page from '../components/Page'
import TipProbe from '../components/TipProbe'
import ConfirmTipProbeModal from '../components/ConfirmTipProbeModal'
import {InstrumentTabs, Instruments} from '../components/setup-instruments'

import SessionHeader from '../containers/SessionHeader'

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

  return (
    <Page>
      <SessionHeader />
      <InstrumentTabs mount={mount} />
      <Instruments mount={mount} />
      <TipProbe mount={mount} confirmTipProbeUrl={confirmTipProbeUrl} />
      <Route path={confirmTipProbeUrl} render={() => (
        <ConfirmTipProbeModal mount={mount} backUrl={url} />
      )} />
    </Page>
  )
}
