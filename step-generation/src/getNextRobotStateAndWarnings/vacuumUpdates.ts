import {
  VACUUM_APPROACHING_TARGET,
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
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export const forVacuumOpenVent = (
  params: VacuumModuleOpenVentCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState != null) {
    moduleState.ventStatus = VACUUM_VENT_OPEN
    moduleState.vacuumState = null
  }
}

export const forVacuumCloseVent = (
  params: VacuumModuleOpenVentCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState != null) {
    moduleState.ventStatus = VACUUM_VENT_CLOSED
  }
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
      status: VACUUM_APPROACHING_TARGET,
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
      status: VACUUM_APPROACHING_TARGET,
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
