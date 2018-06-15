// @flow
// connect and configure robots page
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Redirect, type ContextRouter} from 'react-router'

import type {State, Dispatch} from '../types'
import type {Robot} from '../robot'
import {selectors as robotSelectors, actions as robotActions} from '../robot'
import createLogger from '../logger'

import {Splash} from '@opentrons/components'
import Page from '../components/Page'
import RobotSettings, {ConnectAlertModal} from '../components/RobotSettings'
import ChangePipette from '../components/ChangePipette'
import CalibrateDeck from '../components/CalibrateDeck'
import ConnectBanner from '../components/RobotSettings/ConnectBanner'

type StateProps = {
  robot: ?Robot,
  connectedName: string,
  showConnectAlert: boolean
}

type DispatchProps = {
  closeConnectAlert: () => *
}

type Props = StateProps & DispatchProps & ContextRouter

const log = createLogger(__filename)

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(RobotSettingsPage)
)

function RobotSettingsPage (props: Props) {
  const {
    robot,
    connectedName,
    showConnectAlert,
    closeConnectAlert,
    match: {path, url, params: {name}}
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

  // TODO(mc, 2018-05-08): pass parentUrl to RobotSettings
  return (
    <React.Fragment>
      <Page
        titleBarProps={{title: robot.name}}
      >
        <ConnectBanner {...robot} key={Number(robot.isConnected)}/>
        <RobotSettings {...robot} />
      </Page>
      <Route path={`${path}/pipettes`} render={(props) => (
        <ChangePipette {...props} robot={robot} parentUrl={url} />
      )} />

      <Route path={`${path}/calibrate-deck`} render={(props) => (
        <CalibrateDeck match={props.match} robot={robot} parentUrl={url} />
      )} />

      {showConnectAlert && (
        <ConnectAlertModal onCloseClick={closeConnectAlert} />
      )}
     </React.Fragment>
  )
}

function mapStateToProps (state: State, ownProps: ContextRouter): StateProps {
  const {match: {params: {name}}} = ownProps
  const robots = robotSelectors.getDiscovered(state)
  const connectRequest = robotSelectors.getConnectRequest(state)
  const connectedName = robotSelectors.getConnectedRobotName(state)

  return {
    connectedName,
    robot: robots.find((r) => r.name === name),
    showConnectAlert: !connectRequest.inProgress && !!connectRequest.error
  }
}

function mapDispatchToProps (dispatch: Dispatch): DispatchProps {
  return {
    closeConnectAlert: () => dispatch(robotActions.clearConnectResponse())
  }
}
