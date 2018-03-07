// @flow
// setup instruments component
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, type ContextRouter} from 'react-router'

import type {State} from '../types'
import type {Instrument} from '../robot'
import {selectors as robotSelectors} from '../robot'

import Page from '../components/Page'
import TipProbe from '../components/TipProbe'
import ConfirmTipProbeModal from '../components/ConfirmTipProbeModal'
import {InstrumentTabs, Instruments} from '../components/setup-instruments'

import SessionHeader from '../containers/SessionHeader'

type StateProps = {
  instruments: Array<Instrument>,
  currentInstrument: ?Instrument
}

type OwnProps = ContextRouter

type Props = StateProps & OwnProps

export default connect(makeMapStateToProps)(SetupInstrumentsPage)

function SetupInstrumentsPage (props: Props) {
  const {instruments, currentInstrument, match: {url, params}} = props
  const confirmTipProbeUrl = `${url}/confirm-tip-probe`

  // redirect back to /calibrate/instruments if mount doesn't exist
  if (params.mount && !currentInstrument) {
    return (<Redirect to={url.replace(`/${params.mount}`, '')} />)
  }

  return (
    <Page>
      <SessionHeader />
      <InstrumentTabs {...{instruments, currentInstrument}} />
      <Instruments {...{instruments, currentInstrument}} />
      {currentInstrument && (
        <TipProbe
          {...currentInstrument}
          confirmTipProbeUrl={confirmTipProbeUrl}
        />
      )}
      {currentInstrument && (
        <Route path={confirmTipProbeUrl} render={() => (
          <ConfirmTipProbeModal
            mount={currentInstrument.mount}
            backUrl={url}
          />
        )} />
      )}
    </Page>
  )
}

function makeMapStateToProps (): (State, OwnProps) => StateProps {
  const getCurrentInstrument = robotSelectors.makeGetCurrentInstrument()

  return (state, props) => ({
    instruments: robotSelectors.getInstruments(state),
    currentInstrument: getCurrentInstrument(state, props)
  })
}
