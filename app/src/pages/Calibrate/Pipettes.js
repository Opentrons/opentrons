// @flow
// setup instruments component
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, type ContextRouter} from 'react-router'

import type {State} from '../../types'
import type {Instrument} from '../../robot'
import {selectors as robotSelectors} from '../../robot'
import {makeGetRobotPipettes} from '../../http-api-client'

import Page from '../../components/Page'
import TipProbe from '../../components/TipProbe'
import ConfirmTipProbeModal from '../../components/ConfirmTipProbeModal'
import {PipetteTabs, Pipettes} from '../../components/calibrate-pipettes'

import SessionHeader from '../../components/SessionHeader'

type StateProps = {
  instruments: Array<Instrument>,
  currentInstrument: ?Instrument
}

type OwnProps = ContextRouter

type Props = StateProps & OwnProps

export default connect(makeMapStateToProps)(CalibratePipettesPage)

function CalibratePipettesPage (props: Props) {
  const {instruments, currentInstrument, match: {url, params}} = props
  const confirmTipProbeUrl = `${url}/confirm-tip-probe`

  // redirect back to /calibrate/instruments if mount doesn't exist
  if (params.mount && !currentInstrument) {
    return (<Redirect to={url.replace(`/${params.mount}`, '')} />)
  }

  return (
    <Page
      titleBarProps={{title: (<SessionHeader />)}}
    >
      <PipetteTabs {...{instruments, currentInstrument}} />
      <Pipettes {...props} />
      {!!currentInstrument && (
        <TipProbe
          {...currentInstrument}
          confirmTipProbeUrl={confirmTipProbeUrl}
        />
      )}
      {!!currentInstrument && (
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
  const getAttachedPipettes = makeGetRobotPipettes()

  return (state, props) => {
    const name = robotSelectors.getConnectedRobotName(state)
    const pipettesResponse = getAttachedPipettes(state, {name})

    return {
      name,
      instruments: robotSelectors.getInstruments(state),
      currentInstrument: getCurrentInstrument(state, props),
      actualPipettes: pipettesResponse.response
    }
  }
}
