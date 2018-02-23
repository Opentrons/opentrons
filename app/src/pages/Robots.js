// @flow
// connect and configure robots page
import React from 'react'
import {connect} from 'react-redux'
import {withRouter, Redirect, type ContextRouter} from 'react-router'

import type {State, Dispatch} from '../types'
import {
  selectors as robotSelectors,
  actions as robotActions,
  type Robot
} from '../robot'

import {TitleBar} from '@opentrons/components'
import Page from '../components/Page'
import RobotSettings, {ConnectAlertModal} from '../components/RobotSettings'
import Splash from '../components/Splash'

type StateProps = {
  robot: ?Robot,
  showConnectAlert: boolean
}

type DispatchProps = {
  closeConnectAlert: () => *
}

type Props = StateProps & DispatchProps & ContextRouter

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(RobotSettingsPage)
)

function RobotSettingsPage (props: Props) {
  const {
    robot,
    showConnectAlert,
    closeConnectAlert,
    match: {url, params: {name}}
  } = props

  if (name && !robot) {
    console.warn(`Robot ${name} does not exist; redirecting`)
    return (<Redirect to={url.replace(`/${name}`, '')} />)
  }

  return (
    <Page>
      {!robot && (<Splash />)}
      {robot && (<TitleBar title={robot.name} />)}
      {robot && (<RobotSettings {...robot} />)}
      {showConnectAlert && (
        <ConnectAlertModal onCloseClick={closeConnectAlert} />
      )}
    </Page>
  )
}

function mapStateToProps (state: State, ownProps: ContextRouter): StateProps {
  const {match: {params: {name}}} = ownProps
  const robots = robotSelectors.getDiscovered(state)
  const connectRequest = robotSelectors.getConnectRequest(state)

  return {
    robot: robots.find((r) => r.name === name),
    showConnectAlert: !connectRequest.inProgress && !!connectRequest.error
  }
}

function mapDispatchToProps (dispatch: Dispatch): DispatchProps {
  return {
    closeConnectAlert: () => dispatch(robotActions.clearConnectResponse())
  }
}
