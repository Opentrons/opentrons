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
  VacuumModuleStartRunProfileCreateCommand,
  VacuumModuleStopPumpCreateCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotStateAndWarnings,
  VacuumModuleState,
} from '../types'

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
  const { moduleId, gaugePressure, duration, ventAfter = true, taskId } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState == null) {
    return
  }
  // if holding indefinitely or not venting after the pressure is reached for a duration, the pressure is held
  // taskId should not be null, but this is to satisfy type checks
  if (duration == null || taskId == null) {
    moduleState.currentPumpActivity = {
      type: 'indefiniteHold',
      mode: VACUUM_MODE_PRESSURE,
      targetPressure: gaugePressure,
    }
  } else {
    moduleState.currentPumpActivity = {
      type: 'timedHold',
      mode: VACUUM_MODE_PRESSURE,
      targetPressure: gaugePressure,
      durationSeconds: duration,
      taskId,
      ventAfter,
    }
    moduleState.numPumpActivitiesStarted++
  }
  // vent status is always closed for timed holds. Opening will be handled by the wait for task updates
  moduleState.ventStatus = VACUUM_VENT_CLOSED
}

export const forVacuumSetPumpPower = (
  params: VacuumModuleSetTargetPowerCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId, percentPower, duration, ventAfter = true, taskId } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState == null) {
    return
  }
  // if holding indefinitely or not venting after the power is reached for a duration, the power is held
  // taskId should not be null, but this is to satisfy type checks
  if (duration == null || taskId == null) {
    moduleState.currentPumpActivity = {
      type: 'indefiniteHold',
      mode: VACUUM_MODE_POWER,
      targetPower: percentPower,
    }
  } else {
    moduleState.currentPumpActivity = {
      type: 'timedHold',
      mode: VACUUM_MODE_POWER,
      targetPower: percentPower,
      durationSeconds: duration,
      taskId,
      ventAfter,
    }
    moduleState.numPumpActivitiesStarted++
  }
  // vent status is always closed for timed holds. Opening will be handled by the wait for task updates
  moduleState.ventStatus = VACUUM_VENT_CLOSED
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
  moduleState.currentPumpActivity = {
    type: 'pumpDeactivated',
  }
}

export const forVacuumStartRunProfile = (
  params: VacuumModuleStartRunProfileCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { moduleId, steps, taskId, ventAfter = true } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  // taskId should not be null, but this is to satisfy type checks
  if (moduleState == null || taskId == null) {
    return
  }
  moduleState.currentPumpActivity = {
    type: 'profile',
    profileElements: steps,
    taskId,
    ventAfter,
  }
  moduleState.numPumpActivitiesStarted++
}

export const handleWaitForTaskForVacuums = (
  vacuumModuleState: VacuumModuleState
): boolean => {
  if (
    vacuumModuleState.currentPumpActivity.type === 'timedHold' ||
    vacuumModuleState.currentPumpActivity.type === 'profile'
  ) {
    const shouldVentAfter = vacuumModuleState.currentPumpActivity.ventAfter
    vacuumModuleState.currentPumpActivity = { type: 'pumpDeactivated' }
    vacuumModuleState.ventStatus = shouldVentAfter
      ? VACUUM_VENT_OPEN
      : VACUUM_VENT_CLOSED
    return true
  }
  return false
}
