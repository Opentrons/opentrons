import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
  VACUUM_VENT_CLOSED,
  VACUUM_VENT_OPEN,
} from '../constants'
import { vacuumModuleStateGetter } from '../robotStateSelectors'

import type {
  VacuumModuleOpenVentCreateCommand,
  VacuumModuleSetTargetPowerCreateCommand,
  VacuumModuleSetTargetPressureCreateCommand,
  VacuumModuleStopPumpCreateCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
  VentStatus,
} from '../types'

function _vacuumVentUpdate(args: {
  state: VentStatus
  moduleId: string
  robotState: RobotState
}): void {
  const { state, moduleId, robotState } = args
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState != null) {
    moduleState.ventStatus = state
  }
}

export const forVacuumOpenVent = (
  params: VacuumModuleOpenVentCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings
  _vacuumVentUpdate({
    state: VACUUM_VENT_OPEN,
    moduleId,
    robotState,
  })
}

export const forVacuumCloseVent = (
  params: VacuumModuleOpenVentCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings
  _vacuumVentUpdate({
    state: VACUUM_VENT_CLOSED,
    moduleId,
    robotState,
  })
}

export const forVacuumSetPumpPressure = (
  params: VacuumModuleSetTargetPressureCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId, gaugePressure, duration, ventAfter = true } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState == null) {
    return
  }
  // if holding indefinitely or not venting after the pressure is reached for a duration, the pressure is held
  if (duration == null || !ventAfter) {
    moduleState.vacuumState = {
      modeType: VACUUM_MODE_PRESSURE,
      targetPressure: gaugePressure,
      currentPressure: null,
    }
    moduleState.ventStatus = VACUUM_VENT_CLOSED
  } else {
    moduleState.vacuumState = null
    moduleState.ventStatus = VACUUM_VENT_OPEN
  }
}

export const forVacuumSetPumpPower = (
  params: VacuumModuleSetTargetPowerCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId, percentPower, duration, ventAfter = true } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState == null) {
    return
  }
  // if holding indefinitely or not venting after the power is reached for a duration, the power is held
  if (duration == null || !ventAfter) {
    moduleState.vacuumState = {
      modeType: VACUUM_MODE_POWER,
      targetPower: percentPower,
      currentPower: null,
    }
    moduleState.ventStatus = VACUUM_VENT_CLOSED
  } else {
    moduleState.vacuumState = null
    moduleState.ventStatus = VACUUM_VENT_OPEN
  }
}

export const forVacuumStopPump = (
  params: VacuumModuleStopPumpCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState == null) {
    return
  }
  moduleState.vacuumState = null
}
