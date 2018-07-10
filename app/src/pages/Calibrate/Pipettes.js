// @flow
// setup pipettes component
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, type ContextRouter} from 'react-router'

import type {State} from '../../types'
import type {Pipette} from '../../robot'
import {selectors as robotSelectors} from '../../robot'
import {makeGetRobotPipettes} from '../../http-api-client'

import Page from '../../components/Page'
import TipProbe from '../../components/TipProbe'
import ConfirmTipProbeModal from '../../components/ConfirmTipProbeModal'
import {PipetteTabs, Pipettes} from '../../components/calibrate-pipettes'

import SessionHeader from '../../components/SessionHeader'

type StateProps = {
  pipettes: Array<Pipette>,
  currentPipette: ?Pipette
}

type OwnProps = ContextRouter

type Props = StateProps & OwnProps

export default connect(makeMapStateToProps)(CalibratePipettesPage)

function CalibratePipettesPage (props: Props) {
  const {pipettes, currentPipette, match: {url, params}} = props
  const confirmTipProbeUrl = `${url}/confirm-tip-probe`

  // redirect back to mountless route if mount doesn't exist
  if (params.mount && !currentPipette) {
    return (<Redirect to={url.replace(`/${params.mount}`, '')} />)
  }

  return (
    <Page
      titleBarProps={{title: (<SessionHeader />)}}
    >
      <PipetteTabs {...{pipettes, currentPipette}} />
      <Pipettes {...props} />
      {!!currentPipette && (
        <TipProbe
          {...currentPipette}
          confirmTipProbeUrl={confirmTipProbeUrl}
        />
      )}
      {!!currentPipette && (
        <Route path={confirmTipProbeUrl} render={() => (
          <ConfirmTipProbeModal
            mount={currentPipette.mount}
            backUrl={url}
          />
        )} />
      )}
    </Page>
  )
}

function makeMapStateToProps (): (State, OwnProps) => StateProps {
  const getCurrentPipette = robotSelectors.makeGetCurrentPipette()
  const getAttachedPipettes = makeGetRobotPipettes()

  return (state, props) => {
    const name = robotSelectors.getConnectedRobotName(state)
    const pipettesResponse = getAttachedPipettes(state, {name})

    return {
      name,
      pipettes: robotSelectors.getPipettes(state),
      currentPipette: getCurrentPipette(state, props),
      actualPipettes: pipettesResponse.response
    }
  }
}
