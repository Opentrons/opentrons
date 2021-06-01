// connect and configure robots page
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouteMatch, Route, Switch, Redirect } from 'react-router-dom'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../../redux/robot'
import { CONNECTABLE, REACHABLE } from '../../../redux/discovery'
import {
  UPGRADE,
  getBuildrootUpdateSeen,
  getBuildrootUpdateDisplayInfo,
  getBuildrootUpdateInProgress,
  getBuildrootUpdateAvailable,
} from '../../../redux/buildroot'

import { getRobotRestarting } from '../../../redux/robot-admin'
import {
  getMovementStatus,
  getMovementError,
  clearMovementStatus,
  HOMING,
} from '../../../redux/robot-controls'
import { getRobotRestartRequired } from '../../../redux/robot-settings'

import { SpinnerModalPage } from '@opentrons/components'
import { CardContainer, CardRow } from '../../../atoms/layout'
import { Page } from '../../../atoms/Page'
import { ErrorModal } from '../../../molecules/modals'
import { ConnectAlertModal } from './ConnectAlertModal'
import { UpdateBuildroot } from './UpdateBuildroot'
import { ConnectBanner } from './ConnectBanner'
import { ReachableRobotBanner } from './ReachableRobotBanner'
import { RestartRequiredBanner } from './RestartRequiredBanner'
import { ResetRobotModal } from './ResetRobotModal'
import { StatusCard } from './StatusCard'
import { InformationCard } from './InformationCard'
import { ControlsCard } from './ControlsCard'
import { ConnectionCard } from './ConnectionCard'
import { AdvancedSettingsCard } from './AdvancedSettingsCard'
import { CalibrationCard } from './CalibrationCard'

import type { State, Dispatch } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'

interface Props {
  robot: ViewableRobot
}

// TODO(bc, 2021-02-16): i18n
const UPDATE_FRAGMENT = 'update'
const RESET_FRAGMENT = 'reset'
const INSTRUMENTS_FRAGMENT = 'instruments'

export function RobotSettings(props: Props): JSX.Element {
  const { robot } = props
  const { name: robotName } = robot

  const { path, url } = useRouteMatch()
  const dispatch = useDispatch<Dispatch>()
  const updateInProgress = useSelector((state: State) =>
    getBuildrootUpdateInProgress(state, robot)
  )
  const restarting = useSelector((state: State) =>
    getRobotRestarting(state, robotName)
  )
  const restartRequired = useSelector((state: State) =>
    getRobotRestartRequired(state, robotName)
  )
  const homeInProgress =
    useSelector((state: State) => getMovementStatus(state, robotName)) ===
    HOMING
  const homeError = useSelector((state: State) =>
    getMovementError(state, robotName)
  )
  const connectRequest = useSelector((state: State) =>
    robotSelectors.getConnectRequest(state)
  )

  const buildrootUpdateSeen = useSelector((state: State) =>
    getBuildrootUpdateSeen(state)
  )
  const buildrootUpdateType = useSelector((state: State) =>
    getBuildrootUpdateAvailable(state, robot)
  )
  const { autoUpdateDisabledReason } = useSelector((state: State) =>
    getBuildrootUpdateDisplayInfo(state, robotName)
  )

  const updateUrl = `${url}/${UPDATE_FRAGMENT}`
  const resetUrl = `${url}/${RESET_FRAGMENT}`
  const pipettesPageUrl = `${url}/${INSTRUMENTS_FRAGMENT}`
  const titleBarProps = { title: robot.displayName }

  const showConnectAlert = !connectRequest.inProgress && !!connectRequest.error

  const showUpdateModal = Boolean(
    updateInProgress ||
      (!buildrootUpdateSeen &&
        buildrootUpdateType === UPGRADE &&
        autoUpdateDisabledReason === null)
  )

  // TODO(mc, 2018-07-26): these routes are too complicated and mess with the
  // active state of the robot side-panel links. Remove in favor of a component
  // or redux state-based solution
  // TODO(bc, 2020-03-20): all of the buttons in these settings cards are disabled for
  // various reasons.  We should surface those reasons to users in hover tooltips
  // on the buttons, this is currently limited by the existing LabeledButton component.
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
        <CardContainer key={robotName}>
          <CardRow>
            <StatusCard robot={robot} />
          </CardRow>
          <CardRow>
            <InformationCard robot={robot} updateUrl={updateUrl} />
          </CardRow>
          <CardRow>
            <CalibrationCard robot={robot} pipettesPageUrl={pipettesPageUrl} />
          </CardRow>
          <CardRow>
            <ControlsCard robot={robot} />
          </CardRow>
          <CardRow>
            <ConnectionCard robot={robot} />
          </CardRow>
          <CardRow>
            <AdvancedSettingsCard robot={robot} resetUrl={resetUrl} />
          </CardRow>
        </CardContainer>
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
                    close={() => dispatch(clearMovementStatus(robotName))}
                  />
                )}
              </>
            )
          }}
        />
      </Switch>

      {showConnectAlert && (
        <ConnectAlertModal
          onCloseClick={() => dispatch(robotActions.clearConnectResponse())}
        />
      )}
    </>
  )
}
