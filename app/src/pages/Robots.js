// @flow
// connect and configure robots page
import React from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Redirect, type ContextRouter} from 'react-router'

import type {State, Dispatch} from '../types'
import type {Robot, Mount} from '../robot'
import {selectors as robotSelectors, actions as robotActions} from '../robot'

import {TitleBar, Splash} from '@opentrons/components'
import Page from '../components/Page'
import RobotSettings, {ConnectAlertModal} from '../components/RobotSettings'
import ChangePipette from '../components/ChangePipette'

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

  if (!robot) return (<Page><Splash /></Page>)

  return (
    <Page>
      <TitleBar title={robot.name} />
      <RobotSettings {...robot} />

      <Route path={`${url}/pipettes/:mount`} render={(routeProps) => {
        const routeMatch = routeProps.match
        const mount: Mount = (routeMatch.params.mount: any)

        return (
          <ChangePipette
            closeUrl={url}
            baseUrl={routeMatch.url}
            robot={robot}
            mount={mount}
          />
        )
      }} />

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
