import { createSelector } from 'reselect'

import { getConnectedRobot } from '../discovery'
import {
  getProtocolPipettesMatching,
  getProtocolPipettesCalibrated,
  getAttachedPipetteCalibrations,
  PIPETTE_MOUNTS,
} from '../pipettes'
import { selectors as RobotSelectors } from '../robot'
import { UPGRADE, getBuildrootUpdateAvailable } from '../buildroot'
import { getAvailableShellUpdate } from '../shell'
import { getU2EWindowsDriverStatus, OUTDATED } from '../system-info'
import { getDeckCalibrationStatus, DECK_CAL_STATUS_OK } from '../calibration'
import { getFeatureFlags } from '../config'
import { getProtocolData } from '../protocol'

import type { State } from '../types'
import type { NavLocation } from './types'

// TODO(mc, 2019-11-26): i18n
const ROBOT = 'Robot'
const PROTOCOL = 'Protocol'
const CALIBRATE = 'Calibrate'
const RUN = 'Run'
export const MORE = 'More'

const PLEASE_CONNECT_TO_A_ROBOT = 'Please connect to a robot to proceed'
const PLEASE_LOAD_A_PROTOCOL = 'Please load a protocol to proceed'
const PLEASE_LOAD_A_RUNNABLE_PROTOCOL =
  'Please load a protocol with runnable steps to proceed'
const ATTACHED_PIPETTES_DO_NOT_MATCH =
  'Attached pipettes do not match pipettes specified in loaded protocol'
const PIPETTES_NOT_CALIBRATED =
  'Please calibrate all pipettes specified in loaded protocol to proceed'
const CANNOT_UPLOAD_A_NEW_PROTOCOL_WHILE_RUNNING =
  'Cannot upload a new protocol while a run is in progress'
const CANNOT_CALIBRATE_WHILE_RUNNING =
  'Cannot calibrate while a run is in progress'
const PLEASE_RESET_PROTOCOL =
  'Please reset your protocol run before re-calibrating'
const CALIBRATE_DECK_TO_PROCEED = 'Calibrate your deck to proceed'

const APP_UPDATE_AVAILABLE = 'An app update is available'
const DRIVER_UPDATE_AVAILABLE = 'A driver update is available'
const ROBOT_UPDATE_AVAILABLE = 'A robot software update is available'
const ROBOT_CALIBRATION_RECOMMENDED = 'Robot calibration recommended'

const getConnectedRobotPipettesMatch = (state: State): boolean => {
  const connectedRobot = getConnectedRobot(state)

  return connectedRobot
    ? getProtocolPipettesMatching(state, connectedRobot.name)
    : false
}

const getConnectedRobotPipettesCalibrated = (state: State): boolean => {
  const connectedRobot = getConnectedRobot(state)

  return connectedRobot
    ? getProtocolPipettesCalibrated(state, connectedRobot.name)
    : false
}

const getConnectedRobotUpdateAvailable = (state: State): boolean => {
  const connectedRobot = getConnectedRobot(state)
  const robotUpdateType = connectedRobot
    ? getBuildrootUpdateAvailable(state, connectedRobot)
    : null

  return robotUpdateType === UPGRADE
}

const getDeckCalibrationOk = (state: State): boolean => {
  const connectedRobot = getConnectedRobot(state)
  const deckCalStatus = connectedRobot
    ? getDeckCalibrationStatus(state, connectedRobot.name)
    : null
  return deckCalStatus === DECK_CAL_STATUS_OK
}

const getRobotCalibrationOk = (state: State): boolean => {
  const connectedRobot = getConnectedRobot(state)
  if (!connectedRobot) return false

  const deckCalOk = getDeckCalibrationOk(state)
  const pipCal = getAttachedPipetteCalibrations(state, connectedRobot.name)
  for (const m of PIPETTE_MOUNTS) {
    if (pipCal) {
      if (
        pipCal[m]?.offset?.status?.markedBad ||
        pipCal[m]?.tipLength?.status?.markedBad
      ) {
        return false
      }
    }
  }
  return deckCalOk
}

export const getRunDisabledReasonRPC: (
  state: State
) => string | null = createSelector(
  getConnectedRobot,
  RobotSelectors.getSessionIsLoaded,
  RobotSelectors.getCommands,
  getConnectedRobotPipettesMatch,
  getConnectedRobotPipettesCalibrated,
  getDeckCalibrationOk,
  (robot, loaded, commands, pipettesMatch, pipettesCalibrated, deckCalOk) => {
    if (!robot) return PLEASE_CONNECT_TO_A_ROBOT
    if (!loaded) return PLEASE_LOAD_A_PROTOCOL
    if (commands.length === 0) return PLEASE_LOAD_A_RUNNABLE_PROTOCOL
    if (!pipettesMatch) return ATTACHED_PIPETTES_DO_NOT_MATCH
    if (!pipettesCalibrated) return PIPETTES_NOT_CALIBRATED
    if (!deckCalOk) return CALIBRATE_DECK_TO_PROCEED
    return null
  }
)

export const getRunDisabledReasonNoRPC: (
  state: State
) => string | null = createSelector(
  getConnectedRobot,
  getProtocolData,
  getConnectedRobotPipettesMatch,
  getConnectedRobotPipettesCalibrated,
  getDeckCalibrationOk,
  (robot, protocolData, pipettesMatch, pipettesCalibrated, deckCalOk) => {
    if (!robot) return PLEASE_CONNECT_TO_A_ROBOT
    if (!protocolData) return PLEASE_LOAD_A_PROTOCOL
    if (!pipettesMatch) return ATTACHED_PIPETTES_DO_NOT_MATCH
    if (!pipettesCalibrated) return PIPETTES_NOT_CALIBRATED
    if (!deckCalOk) return CALIBRATE_DECK_TO_PROCEED
    return null
  }
)

export const getRunDisabledReason: (
  state: State
) => string | null = createSelector(
  getRunDisabledReasonRPC,
  getRunDisabledReasonNoRPC,
  getFeatureFlags,
  (disabledReasonRPC, disabledReasonNoRPC, featureFlags) => {
    if (Boolean(featureFlags.preProtocolFlowWithoutRPC)) {
      return disabledReasonNoRPC
    }
    return disabledReasonRPC
  }
)

export const getRobotsLocation: (state: State) => NavLocation = createSelector(
  getConnectedRobot,
  getConnectedRobotUpdateAvailable,
  getRobotCalibrationOk,
  (robot, update, robotCalOk) => ({
    id: 'robots',
    path: '/robots',
    title: ROBOT,
    iconName: 'ot-connect',
    notificationReason: update ? ROBOT_UPDATE_AVAILABLE : null,
    warningReason: robot && !robotCalOk ? ROBOT_CALIBRATION_RECOMMENDED : null,
  })
)

export const getUploadLocation: (state: State) => NavLocation = createSelector(
  getConnectedRobot,
  RobotSelectors.getIsRunning,
  getDeckCalibrationOk,
  (robot, running, deckCalOk) => {
    let disabledReason = null
    if (robot == null) {
      disabledReason = PLEASE_CONNECT_TO_A_ROBOT
    } else if (running) {
      disabledReason = CANNOT_UPLOAD_A_NEW_PROTOCOL_WHILE_RUNNING
    } else if (!deckCalOk) {
      disabledReason = CALIBRATE_DECK_TO_PROCEED
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

export const getCalibrateLocation: (
  state: State
) => NavLocation = createSelector(
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

export const getRunLocation: (state: State) => NavLocation = createSelector(
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

export const getMoreLocation: (state: State) => NavLocation = createSelector(
  getAvailableShellUpdate,
  getU2EWindowsDriverStatus,
  (appUpdate, driverStatus) => {
    let notificationReason = null
    if (appUpdate) {
      notificationReason = APP_UPDATE_AVAILABLE
    } else if (driverStatus === OUTDATED) {
      notificationReason = DRIVER_UPDATE_AVAILABLE
    }

    return {
      id: 'more',
      path: '/more',
      title: MORE,
      iconName: 'dots-horizontal',
      notificationReason,
    }
  }
)

export const getNavbarLocations: (
  state: State
) => NavLocation[] = createSelector(
  getRobotsLocation,
  getUploadLocation,
  getCalibrateLocation,
  getRunLocation,
  getMoreLocation,
  getFeatureFlags,
  (robots, upload, calibrate, run, more, ff) => {
    if (Boolean(ff.preProtocolFlowWithoutRPC)) {
      return [robots, upload, run, more]
    } else {
      return [robots, upload, calibrate, run, more]
    }
  }
)
