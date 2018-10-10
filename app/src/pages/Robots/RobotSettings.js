// @flow
// connect and configure robots page
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Switch, Redirect, type Match} from 'react-router'

import {selectors as robotSelectors, actions as robotActions} from '../../robot'
import {CONNECTABLE, REACHABLE} from '../../discovery'
import {
  makeGetRobotHome,
  clearHomeResponse,
  makeGetRobotIgnoredUpdateRequest,
  makeGetRobotRestartRequest,
  makeGetRobotUpdateInfo,
} from '../../http-api-client'

import {SpinnerModalPage} from '@opentrons/components'
import {ErrorModal} from '../../components/modals'
import Page from '../../components/Page'
import RobotSettings, {
  ConnectAlertModal,
  RobotUpdateModal,
} from '../../components/RobotSettings'
import CalibrateDeck from '../../components/CalibrateDeck'
import ConnectBanner from '../../components/RobotSettings/ConnectBanner'
import ReachableRobotBanner from '../../components/RobotSettings/ReachableRobotBanner'
import ResetRobotModal from '../../components/RobotSettings/ResetRobotModal'

import type {State, Dispatch, Error} from '../../types'
import type {ViewableRobot} from '../../discovery'

type SP = {
  showUpdateModal: boolean,
  showConnectAlert: boolean,
  homeInProgress: ?boolean,
  homeError: ?Error,
}

type DP = {dispatch: Dispatch}

type OP = {
  robot: ViewableRobot,
  match: Match,
}

type Props = SP &
  OP & {
    closeHomeAlert?: () => mixed,
    closeConnectAlert: () => mixed,
  }

export default withRouter(
  connect(
    makeMapStateToProps,
    null,
    mergeProps
  )(RobotSettingsPage)
)

const UPDATE_FRAGMENT = 'update'
const CALIBRATE_DECK_FRAGMENT = 'calibrate-deck'

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
        {robot.status === REACHABLE && (
          <ReachableRobotBanner key={robot.name} {...robot} />
        )}
        {robot.status === CONNECTABLE && (
          <ConnectBanner {...robot} key={Number(robot.connected)} />
        )}

        <RobotSettings
          robot={robot}
          updateUrl={`${url}/${UPDATE_FRAGMENT}`}
          calibrateDeckUrl={`${url}/${CALIBRATE_DECK_FRAGMENT}`}
        />
      </Page>
      <Switch>
        <Route
          path={`${path}/${UPDATE_FRAGMENT}`}
          render={() => <RobotUpdateModal robot={robot} />}
        />

        <Route
          path={`${path}/${CALIBRATE_DECK_FRAGMENT}`}
          render={props => (
            <CalibrateDeck match={props.match} robot={robot} parentUrl={url} />
          )}
        />

        <Route
          path={`${path}/reset`}
          render={props => <ResetRobotModal robot={robot} />}
        />

        <Route
          exact
          path={path}
          render={() => {
            if (showUpdateModal) {
              return <Redirect to={`${url}/${UPDATE_FRAGMENT}`} />
            }

            // only show homing spinner and error on main page
            // otherwise, it will show up during homes in pipette swap
            return (
              <React.Fragment>
                {homeInProgress && (
                  <SpinnerModalPage
                    titleBar={titleBarProps}
                    message="Robot is homing."
                  />
                )}

                {!!homeError && (
                  <ErrorModal
                    heading="Robot unable to home"
                    error={homeError}
                    description="Robot was unable to home, please try again."
                    close={closeHomeAlert}
                  />
                )}
              </React.Fragment>
            )
          }}
        />
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
  const getRestartRequest = makeGetRobotRestartRequest()
  const getRobotUpdateInfo = makeGetRobotUpdateInfo()

  return (state, ownProps) => {
    const {robot} = ownProps
    const connectRequest = robotSelectors.getConnectRequest(state)
    const homeRequest = getHomeRequest(state, robot)
    const ignoredRequest = getUpdateIgnoredRequest(state, robot)
    const restartRequest = getRestartRequest(state, robot)
    const updateInfo = getRobotUpdateInfo(state, robot)
    const showUpdateModal =
      // only show the alert modal if there's an upgrade available
      updateInfo.type === 'upgrade' &&
      // and we haven't already ignored the upgrade
      ignoredRequest.response &&
      ignoredRequest.response.version !== updateInfo.version &&
      // and we're not actively restarting
      !restartRequest.inProgress &&
      // TODO(mc, 2018-09-27): clear this state out on disconnect otherwise
      // restartRequest.response latches this modal closed (which is fine,
      // but only for this specific modal)
      !restartRequest.response

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
