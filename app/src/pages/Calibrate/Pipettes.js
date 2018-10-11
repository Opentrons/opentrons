// @flow
// setup pipettes component
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Redirect} from 'react-router'

import {selectors as robotSelectors} from '../../robot'
import {makeGetRobotPipettes, fetchPipettes} from '../../http-api-client'
import {getConnectedRobot} from '../../discovery'

import Page, {RefreshWrapper} from '../../components/Page'
import TipProbe from '../../components/TipProbe'
import ConfirmTipProbeModal from '../../components/ConfirmTipProbeModal'
import {PipetteTabs, Pipettes} from '../../components/calibrate-pipettes'
import SessionHeader from '../../components/SessionHeader'

import type {ContextRouter} from 'react-router'
import type {State} from '../../types'
import type {Pipette} from '../../robot'
import type {PipettesResponse} from '../../http-api-client'
import type {Robot} from '../../discovery'

type OP = ContextRouter

type SP = {|
  pipettes: Array<Pipette>,
  currentPipette: ?Pipette,
  actualPipettes: ?PipettesResponse,
  _robot: ?Robot,
|}

type DP = {|dispatch: Dispatch|}

type Props = {
  ...OP,
  ...SP,
  fetchPipettes: () => mixed,
  changePipetteUrl: string,
}

export default connect(makeMapStateToProps, null, mergeProps)(CalibratePipettesPage)

function CalibratePipettesPage (props: Props) {
  const {
    pipettes,
    currentPipette,
    fetchPipettes,
    match: {url, params},
    changePipetteUrl,
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
      <Pipettes {...props} changePipetteUrl={changePipetteUrl} />
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
    const _robot = getConnectedRobot(state)
    const pipettesCall = _robot && getAttachedPipettes(state, _robot)

    return {
      _robot,
      pipettes: robotSelectors.getPipettes(state),
      currentPipette: getCurrentPipette(state, props),
      actualPipettes: pipettesCall && pipettesCall.response,
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {dispatch} = dispatchProps
  const {_robot} = stateProps
  const changePipetteUrl = _robot ? `/robots/${_robot.name}/instruments` : '/robots'

  return {
    ...ownProps,
    ...stateProps,
    changePipetteUrl,
    fetchPipettes: () => _robot && dispatch(fetchPipettes(_robot)),
  }
}
