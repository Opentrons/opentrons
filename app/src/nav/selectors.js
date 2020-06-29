// @flow
import { createSelector } from 'reselect'

import { getBuildrootUpdateAvailable } from '../buildroot'
import { getFeatureFlags } from '../config'
import { getConnectedRobot } from '../discovery'
import { getProtocolPipettesMatch } from '../pipettes'
import { selectors as RobotSelectors } from '../robot'
import { getAvailableShellUpdate } from '../shell'
import { getU2EWindowsDriverStatus, OUTDATED } from '../system-info'
import type { State } from '../types'
import type { NavLocation } from './types'

// TODO(mc, 2019-11-26): i18n
const ROBOT = 'Robot'
const PROTOCOL = 'Protocol'
const CALIBRATE = 'Calibrate'
const RUN = 'Run'
const MORE = 'More'

const PLEASE_CONNECT_TO_A_ROBOT = 'Please connect to a robot to proceed'
const PLEASE_LOAD_A_PROTOCOL = 'Please load a protocol to proceed'
const PLEASE_LOAD_A_RUNNABLE_PROTOCOL =
  'Please load a protocol with runnable steps to proceed'
const ATTACHED_PIPETTES_DO_NOT_MATCH =
  'Attached pipettes do not match pipettes specified in loaded protocol'
const CANNOT_UPLOAD_A_NEW_PROTOCOL_WHILE_RUNNING =
  'Cannot upload a new protocol while a run is in progress'
const CANNOT_CALIBRATE_WHILE_RUNNING =
  'Cannot calibrate while a run is in progress'
const PLEASE_RESET_PROTOCOL =
  'Please reset your protocol run before re-calibrating'

const APP_UPDATE_AVAILABLE = 'An app update is available'
const DRIVER_UPDATE_AVAILABLE = 'A driver update is available'
const ROBOT_UPDATE_AVAILABLE = 'A robot software update is available'

const getConnectedRobotPipettesMatch: State => boolean = createSelector(
  state => state,
  getConnectedRobot,
  (state, connectedRobot) =>
    connectedRobot
      ? getProtocolPipettesMatch(state, connectedRobot.name)
      : false
)

const getConnectedRobotUpdateAvailable: State => boolean = createSelector(
  state => state,
  getConnectedRobot,
  (state, connectedRobot) => {
    const robotUpdateType = connectedRobot
      ? getBuildrootUpdateAvailable(state, connectedRobot)
      : null
    return robotUpdateType === 'upgrade'
  }
)

const getRunDisabledReason: State => string | null = createSelector(
  getConnectedRobot,
  RobotSelectors.getSessionIsLoaded,
  RobotSelectors.getCommands,
  getConnectedRobotPipettesMatch,
  (robot, loaded, commands, pipettesMatch) => {
    if (!robot) return PLEASE_CONNECT_TO_A_ROBOT
    if (!loaded) return PLEASE_LOAD_A_PROTOCOL
    if (commands.length === 0) return PLEASE_LOAD_A_RUNNABLE_PROTOCOL
    if (!pipettesMatch) return ATTACHED_PIPETTES_DO_NOT_MATCH
    return null
  }
)

export const getRobotsLocation: State => NavLocation = createSelector(
  getConnectedRobotUpdateAvailable,
  update => ({
    id: 'robots',
    path: '/robots',
    title: ROBOT,
    iconName: 'ot-connect',
    notificationReason: update ? ROBOT_UPDATE_AVAILABLE : null,
  })
)

export const getUploadLocation: State => NavLocation = createSelector(
  getConnectedRobot,
  RobotSelectors.getIsRunning,
  (robot, running) => {
    let disabledReason = null
    if (robot == null) {
      disabledReason = PLEASE_CONNECT_TO_A_ROBOT
    } else if (running) {
      disabledReason = CANNOT_UPLOAD_A_NEW_PROTOCOL_WHILE_RUNNING
    }

    return {
      id: 'upload',
      path: '/upload',
      title: PROTOCOL,
      iconName: 'ot-file',
      disabledReason,
    }
  }
)

export const getCalibrateLocation: State => NavLocation = createSelector(
  RobotSelectors.getIsRunning,
  RobotSelectors.getIsDone,
  getRunDisabledReason,
  (running, runFinished, runDisabledReason) => {
    let disabledReason
    if (running) {
      disabledReason = CANNOT_CALIBRATE_WHILE_RUNNING
    } else if (runFinished) {
      disabledReason = PLEASE_RESET_PROTOCOL
    } else {
      disabledReason = runDisabledReason
    }

    return {
      id: 'calibrate',
      path: '/calibrate',
      title: CALIBRATE,
      iconName: 'ot-calibrate',
      disabledReason,
    }
  }
)

export const getRunLocation: State => NavLocation = createSelector(
  getRunDisabledReason,
  disabledReason => {
    return {
      id: 'run',
      path: '/run',
      title: RUN,
      iconName: 'ot-run',
      disabledReason,
    }
  }
)

export const getMoreLocation: State => NavLocation = createSelector(
  getAvailableShellUpdate,
  getU2EWindowsDriverStatus,
  getFeatureFlags,
  (appUpdate, driverStatus, flags) => {
    let notificationReason = null
    if (appUpdate) {
      notificationReason = APP_UPDATE_AVAILABLE
    } else if (driverStatus === OUTDATED) {
      notificationReason = DRIVER_UPDATE_AVAILABLE
    }

    return {
      id: 'more',
      path: '/menu',
      title: MORE,
      iconName: 'dots-horizontal',
      notificationReason,
    }
  }
)

export const getNavbarLocations: State => Array<NavLocation> = createSelector(
  getRobotsLocation,
  getUploadLocation,
  getCalibrateLocation,
  getRunLocation,
  getMoreLocation,
  (robots, upload, calibrate, run, more) => [
    robots,
    upload,
    calibrate,
    run,
    more,
  ]
)
