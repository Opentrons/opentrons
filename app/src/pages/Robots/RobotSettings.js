// @flow
// connect and configure robots page
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Switch, Redirect, type Match} from 'react-router'

import type {State, Dispatch, Error} from '../../types'
import type {Robot} from '../../robot'
import {selectors as robotSelectors, actions as robotActions} from '../../robot'
import {
  makeGetRobotHome,
  clearHomeResponse,
  makeGetRobotIgnoredUpdateRequest,
  makeGetRobotUpdateInfo,
} from '../../http-api-client'

import {SpinnerModalPage} from '@opentrons/components'
import {ErrorModal} from '../../components/modals'
import Page from '../../components/Page'
import RobotSettings, {
  ConnectAlertModal,
  UpdateModal,
} from '../../components/RobotSettings'
import CalibrateDeck from '../../components/CalibrateDeck'
import ConnectBanner from '../../components/RobotSettings/ConnectBanner'
import ResetRobotModal from '../../components/RobotSettings/ResetRobotModal'

type SP = {
  showUpdateModal: boolean,
  showConnectAlert: boolean,
  homeInProgress: ?boolean,
  homeError: ?Error,
}

type DP = {dispatch: Dispatch}

type OP = {
  robot: Robot,
  match: Match,
}

type Props = SP & OP & {
  closeHomeAlert?: () => mixed,
  closeConnectAlert: () => mixed,
}

export default withRouter(
  connect(makeMapStateToProps, null, mergeProps)(RobotSettingsPage)
)

function RobotSettingsPage (props: Props) {
  const {
    robot,
    homeInProgress,
    homeError,
    closeHomeAlert,
    showConnectAlert,
    closeConnectAlert,
    showUpdateModal,
    match: {path, url},
  } = props

  const titleBarProps = {title: robot.name}

  // TODO(mc, 2018-05-08): pass parentUrl to RobotSettings
  return (
    <React.Fragment>
      <Page titleBarProps={titleBarProps}>
        <ConnectBanner {...robot} key={Number(robot.isConnected)}/>
        <RobotSettings {...robot} />
      </Page>
      <Switch>
        <Route path={`${path}/update`} render={() => (
          <UpdateModal {...robot} />
        )} />

        <Route path={`${path}/calibrate-deck`} render={(props) => (
          <CalibrateDeck match={props.match} robot={robot} parentUrl={url} />
        )} />

        <Route path={`${path}/reset`} render={(props) => (
          <ResetRobotModal robot={robot} />
        )} />

        <Route exact path={path} render={() => {
          if (showUpdateModal) {
            return (<Redirect to={`/robots/${robot.name}/update`} />)
          }

          // only show homing spinner and error on main page
          // otherwise, it will show up during homes in pipette swap
          return (
            <React.Fragment>
              {homeInProgress && (
                <SpinnerModalPage
                  titleBar={titleBarProps}
                  message='Robot is homing.'
                />
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
        }} />
      </Switch>

      {showConnectAlert && (
        <ConnectAlertModal onCloseClick={closeConnectAlert} />
      )}
     </React.Fragment>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getHomeRequest = makeGetRobotHome()
  const getUpdateIgnoredRequest = makeGetRobotIgnoredUpdateRequest()
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()

  return (state, ownProps) => {
    const {robot} = ownProps
    const connectRequest = robotSelectors.getConnectRequest(state)
    const homeRequest = getHomeRequest(state, robot)
    const ignoredRequest = getUpdateIgnoredRequest(state, robot)
    const updateInfo = getRobotUpdateInfo(state, robot)
    const showUpdateModal = (
      updateInfo.type === 'upgrade' &&
      ignoredRequest &&
      ignoredRequest.response &&
      ignoredRequest.response.version !== updateInfo.version
    )

    return {
      showUpdateModal: !!showUpdateModal,
      homeInProgress: homeRequest && homeRequest.inProgress,
      homeError: homeRequest && homeRequest.error,
      showConnectAlert: !connectRequest.inProgress && !!connectRequest.error,
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {robot} = ownProps
  const {dispatch} = dispatchProps
  const props = {
    ...stateProps,
    ...ownProps,
    closeConnectAlert: () => dispatch(robotActions.clearConnectResponse()),
  }

  if (robot) {
    return {
      ...props,
      closeHomeAlert: () => dispatch(clearHomeResponse(robot)),
    }
  }

  return props
}
