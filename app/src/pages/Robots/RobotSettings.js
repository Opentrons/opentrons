// @flow
// connect and configure robots page
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter, Route, Switch, Redirect } from 'react-router-dom'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'
import { CONNECTABLE, REACHABLE } from '../../discovery'
import {
  getBuildrootUpdateSeen,
  getBuildrootRobot,
  getBuildrootUpdateInProgress,
  getBuildrootUpdateAvailable,
} from '../../buildroot'

import { getRobotRestarting } from '../../robot-admin'
import {
  getMovementStatus,
  getMovementError,
  clearMovementStatus,
  HOMING,
} from '../../robot-controls'
import { getRobotRestartRequired } from '../../robot-settings'

import { SpinnerModalPage } from '@opentrons/components'
import { ErrorModal } from '../../components/modals'
import { Page } from '../../components/Page'
import {
  RobotSettings as RobotSettingsContents,
  ConnectAlertModal,
} from '../../components/RobotSettings'
import { UpdateBuildroot } from '../../components/RobotSettings/UpdateBuildroot'
import { CalibrateDeck } from '../../components/LegacyCalibrateDeck'
import { ConnectBanner } from '../../components/RobotSettings/ConnectBanner'
import { ReachableRobotBanner } from '../../components/RobotSettings/ReachableRobotBanner'
import { RestartRequiredBanner } from '../../components/RobotSettings/RestartRequiredBanner'
import { ResetRobotModal } from '../../components/RobotSettings/ResetRobotModal'

import type { ContextRouter } from 'react-router-dom'
import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'
import type { ShellUpdateState } from '../../shell/types'

type OP = {|
  ...ContextRouter,
  robot: ViewableRobot,
  appUpdate: ShellUpdateState,
|}

type SP = {|
  showUpdateModal: boolean,
  showConnectAlert: boolean,
  homeInProgress: boolean,
  homeError: string | null,
  updateInProgress: boolean,
  restartRequired: boolean,
  restarting: boolean,
|}

type DP = {|
  closeHomeAlert: () => mixed,
  closeConnectAlert: () => mixed,
|}

type Props = {| ...OP, ...DP, ...SP |}

export const RobotSettings: React.AbstractComponent<
  $Diff<OP, ContextRouter>
> = withRouter(
  connect<Props, OP, SP, DP, State, Dispatch>(
    mapStateToProps,
    mapDispatchToProps
  )(RobotSettingsComponent)
)

const UPDATE_FRAGMENT = 'update'
const CALIBRATE_DECK_FRAGMENT = 'calibrate-deck'
const RESET_FRAGMENT = 'reset'

function RobotSettingsComponent(props: Props) {
  const {
    robot,
    homeInProgress,
    homeError,
    closeHomeAlert,
    showConnectAlert,
    closeConnectAlert,
    showUpdateModal,
    updateInProgress,
    restartRequired,
    restarting,
    match: { path, url },
  } = props

  const { name: robotName } = robot
  const titleBarProps = { title: robot.displayName }
  const updateUrl = `${url}/${UPDATE_FRAGMENT}`
  const calibrateDeckUrl = `${url}/${CALIBRATE_DECK_FRAGMENT}`
  const resetUrl = `${url}/${RESET_FRAGMENT}`

  // TODO(mc, 2018-07-26): these routes are too complicated and mess with the
  // active state of the robot side-panel links. Remove in favor of a component
  // or redux state-based solution
  return (
    <>
      <Page titleBarProps={titleBarProps}>
        {!restarting && !updateInProgress && (
          <>
            {robot.status === REACHABLE && (
              <ReachableRobotBanner key={robotName} {...robot} />
            )}
            {robot.status === CONNECTABLE && (
              <ConnectBanner {...robot} key={Number(robot.connected)} />
            )}
            {restartRequired && <RestartRequiredBanner robotName={robotName} />}
          </>
        )}

        <RobotSettingsContents
          robot={robot}
          updateUrl={updateUrl}
          calibrateDeckUrl={calibrateDeckUrl}
          resetUrl={resetUrl}
        />
      </Page>
      <Switch>
        <Route
          path={`${path}/${UPDATE_FRAGMENT}`}
          render={routeProps => {
            return (
              <UpdateBuildroot
                robot={robot}
                close={() => routeProps.history.push(url)}
              />
            )
          }}
        />

        <Route
          path={`${path}/${CALIBRATE_DECK_FRAGMENT}`}
          render={() => <CalibrateDeck robot={robot} parentUrl={url} />}
        />

        <Route
          path={`${path}/${RESET_FRAGMENT}`}
          render={routeProps => (
            <ResetRobotModal
              robotName={robotName}
              closeModal={() => routeProps.history.push(url)}
            />
          )}
        />

        <Route
          exact
          path={path}
          render={() => {
            if (showUpdateModal) return <Redirect to={updateUrl} />

            // only show homing spinner and error on main page
            // otherwise, it will show up during homes in pipette swap
            return (
              <>
                {homeInProgress && (
                  <SpinnerModalPage
                    titleBar={titleBarProps}
                    message="Robot is homing."
                  />
                )}

                {restarting && (
                  <SpinnerModalPage
                    titleBar={titleBarProps}
                    message="Robot is restarting."
                  />
                )}

                {homeError !== null && (
                  <ErrorModal
                    heading="Robot unable to home"
                    error={{ message: homeError }}
                    description="Robot was unable to home, please try again."
                    close={closeHomeAlert}
                  />
                )}
              </>
            )
          }}
        />
      </Switch>

      {showConnectAlert && (
        <ConnectAlertModal onCloseClick={closeConnectAlert} />
      )}
    </>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { robot } = ownProps
  const connectRequest = robotSelectors.getConnectRequest(state)
  const movementStatus = getMovementStatus(state, robot.name)
  const movementError = getMovementError(state, robot.name)
  const buildrootUpdateSeen = getBuildrootUpdateSeen(state)
  const buildrootUpdateType = getBuildrootUpdateAvailable(state, robot)
  const updateInProgress = getBuildrootUpdateInProgress(state, robot)
  const currentBrRobot = getBuildrootRobot(state)

  const showUpdateModal =
    updateInProgress ||
    (!buildrootUpdateSeen &&
      buildrootUpdateType === 'upgrade' &&
      currentBrRobot === null)

  return {
    updateInProgress,
    restarting: getRobotRestarting(state, robot.name),
    restartRequired: getRobotRestartRequired(state, robot.name),
    showUpdateModal: !!showUpdateModal,
    homeInProgress: movementStatus === HOMING,
    homeError: movementError,
    showConnectAlert: !connectRequest.inProgress && !!connectRequest.error,
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot } = ownProps

  return {
    closeConnectAlert: () => dispatch(robotActions.clearConnectResponse()),
    closeHomeAlert: () => dispatch(clearMovementStatus(robot.name)),
  }
}
