// @flow
// connect and configure robots page
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Redirect, type Match} from 'react-router'

import type {State, Dispatch, Error} from '../types'
import type {Robot} from '../robot'
import {selectors as robotSelectors, actions as robotActions} from '../robot'
import {
  makeGetRobotHome,
  clearHomeResponse,
  makeGetIgnoredUpdate,
  makeGetAvailableRobotUpdate,
  type IgnoredUpdate
} from '../http-api-client'

import createLogger from '../logger'

import {Splash, SpinnerModalPage} from '@opentrons/components'
import {ErrorModal} from '../components/modals'
import Page from '../components/Page'
import RobotSettings, {
  ConnectAlertModal,
  UpdateModal
} from '../components/RobotSettings'
import ChangePipette from '../components/ChangePipette'
import CalibrateDeck from '../components/CalibrateDeck'
import ConnectBanner from '../components/RobotSettings/ConnectBanner'

type SP = {
  robot: ?Robot,
  ignoredRequest: IgnoredUpdate,
  availableUpdate: ?string,
  connectedName: string,
  showConnectAlert: boolean,
  homeInProgress: ?boolean,
  homeError: ?Error,
}

type DP = {dispatch: Dispatch}

type OP = {match: Match}

type Props = SP & OP & {
  closeHomeAlert?: () => mixed,
  closeConnectAlert: () => mixed,
}

const log = createLogger(__filename)

export default withRouter(
  connect(makeMapStateToProps, null, mergeProps)(RobotSettingsPage)
)

function RobotSettingsPage (props: Props) {
  const {
    robot,
    connectedName,
    homeInProgress,
    homeError,
    closeHomeAlert,
    showConnectAlert,
    closeConnectAlert,
    match: {path, url, params: {name}},
    ignoredRequest,
    availableUpdate
  } = props

  if (name && !robot) {
    const redirectUrl = url.replace(`/${name}`, '')
    log.warn(`Robot ${name} does not exist; redirecting`, {redirectUrl})
    return (<Redirect to={redirectUrl} />)
  } else if (!name && connectedName) {
    const redirectUrl = `${url}/${connectedName}`
    log.debug(`Connected to ${connectedName}; redirecting`, {redirectUrl})
    return (<Redirect to={redirectUrl} />)
  }

  if (!robot) return (<Page><Splash /></Page>)

  // TODO (ka 2018-6-21): show update modal once update ignored is wired up,
  let showUpdateModal = false
  if (ignoredRequest.response && availableUpdate) {
    const ignored = ignoredRequest.response.version
    showUpdateModal = ignored !== availableUpdate
  }
  if (showUpdateModal === true) { log.debug('Available update has not been ignored', {showUpdateModal}) }
  const titleBarProps = {title: robot.name}

  // TODO(mc, 2018-05-08): pass parentUrl to RobotSettings
  return (
    <React.Fragment>
      <Page titleBarProps={titleBarProps}>
        <ConnectBanner {...robot} key={Number(robot.isConnected)}/>
        <RobotSettings {...robot} />
      </Page>

      <Route path={`${path}/update`} render={() => (
        <UpdateModal {...robot} />
      )} />

      <Route path={`${path}/pipettes`} render={(props) => (
        <ChangePipette {...props} robot={robot} parentUrl={url} />
      )} />

      <Route path={`${path}/calibrate-deck`} render={(props) => (
        <CalibrateDeck match={props.match} robot={robot} parentUrl={url} />
      )} />

      {showConnectAlert && (
        <ConnectAlertModal onCloseClick={closeConnectAlert} />
      )}

      {homeInProgress && (
        <SpinnerModalPage titleBar={titleBarProps} message='Robot is homing.' />
      )}

      {!!homeError && (
        <ErrorModal
          heading='Robot unable to home'
          error={homeError}
          description='Robot was unable to home, please try again.'
          close={closeHomeAlert}
        />
      )}
     </React.Fragment>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getHomeRequest = makeGetRobotHome()
  const getUpdateIgnoredRequest = makeGetIgnoredUpdate()
  const getAvailableRobotUpdate = makeGetAvailableRobotUpdate()
  return (state, ownProps) => {
    const {match: {params: {name}}} = ownProps
    const robots = robotSelectors.getDiscovered(state)
    const connectRequest = robotSelectors.getConnectRequest(state)
    const connectedName = robotSelectors.getConnectedRobotName(state)
    const robot = robots.find(r => r.name === name)
    const homeRequest = robot && getHomeRequest(state, robot)
    const ignoredRequest = robot && getUpdateIgnoredRequest(state, robot)
    const availableUpdate = robot && getAvailableRobotUpdate(state, robot)
    return {
      connectedName,
      robot,
      ignoredRequest,
      availableUpdate,
      homeInProgress: homeRequest && homeRequest.inProgress,
      homeError: homeRequest && homeRequest.error,
      showConnectAlert: !connectRequest.inProgress && !!connectRequest.error
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {robot} = stateProps
  const {dispatch} = dispatchProps
  const props = {
    ...stateProps,
    ...ownProps,
    closeConnectAlert: () => dispatch(robotActions.clearConnectResponse())
  }

  if (robot) {
    return {
      ...props,
      closeHomeAlert: () => dispatch(clearHomeResponse(robot))
    }
  }

  return props
}
