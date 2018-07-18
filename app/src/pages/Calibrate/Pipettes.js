// @flow
// setup pipettes component
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect, type Match} from 'react-router'

import type {State} from '../../types'
import type {Pipette, Robot} from '../../robot'
import {selectors as robotSelectors} from '../../robot'
import {makeGetRobotPipettes, fetchPipettes} from '../../http-api-client'

import Page, {RefreshWrapper} from '../../components/Page'
import TipProbe from '../../components/TipProbe'
import ConfirmTipProbeModal from '../../components/ConfirmTipProbeModal'
import {PipetteTabs, Pipettes} from '../../components/calibrate-pipettes'

import SessionHeader from '../../components/SessionHeader'

type SP = {
  pipettes: Array<Pipette>,
  currentPipette: ?Pipette,
  robot: Robot,
}

type DP = {dispatch: Dispatch}

type OP = {
  match: Match
}

type Props = SP & OP & {
  fetchPipettes: () => mixed
}

export default connect(makeMapStateToProps, null, mergeProps)(CalibratePipettesPage)

function CalibratePipettesPage (props: Props) {
  const {
    pipettes,
    currentPipette,
    fetchPipettes,
    match: {url, params}
  } = props
  const confirmTipProbeUrl = `${url}/confirm-tip-probe`

  // redirect back to mountless route if mount doesn't exist
  if (params.mount && !currentPipette) {
    return (<Redirect to={url.replace(`/${params.mount}`, '')} />)
  }

  return (
    <RefreshWrapper
      refresh={fetchPipettes}
    >
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
    </RefreshWrapper>
  )
}

function makeMapStateToProps (): (State, OP) => SP {
  const getCurrentPipette = robotSelectors.makeGetCurrentPipette()
  const getAttachedPipettes = makeGetRobotPipettes()

  return (state, props) => {
    const name = robotSelectors.getConnectedRobotName(state)
    const robot = robotSelectors.getConnectedRobot(state)
    const pipettesResponse = getAttachedPipettes(state, {name})

    return {
      name,
      robot,
      pipettes: robotSelectors.getPipettes(state),
      currentPipette: getCurrentPipette(state, props),
      actualPipettes: pipettesResponse.response
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {dispatch} = dispatchProps
  const {robot} = stateProps
  return {
    ...stateProps,
    ...ownProps,
    fetchPipettes: () => { dispatch(fetchPipettes(robot)) }
  }
}
