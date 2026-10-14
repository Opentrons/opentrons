import { getIsPipettableLabware } from '@opentrons/shared-data'

import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
  VACUUM_VENT_CLOSED,
  VACUUM_VENT_OPEN,
} from '../constants'
import { vacuumModuleStateGetter } from '../robotStateSelectors'
import {
  getFullStackFromLabwares,
  resolveBooleanRuntimeValue,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
} from '../utils'

import type {
  LabwareDefinition,
  VacuumModuleStartRunProfileCreateCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntities,
  ModuleStepGenArgs,
  RobotStateAndWarnings,
  TimelineFrame,
  VacuumModuleState,
  VacuumSetPumpPowerStepGenArgs,
  VacuumSetPumpPressureStepGenArgs,
} from '../types'

const getLabwareDimensionsEqual = (
  def1: LabwareDefinition,
  def2: LabwareDefinition
): boolean => {
  const [columns1, columns2] = [def1.ordering, def2.ordering]
  if (columns1.length !== columns2.length) {
    return false
  }
  for (let i = 0; i < columns1.length; i++) {
    const [rows1, rows2] = [columns1[i], columns2[i]]
    if (rows1.length !== rows2.length) {
      return false
    }
  }
  return true
}

const vacuumMergeLiquid = (
  moduleId: string,
  robotState: TimelineFrame,
  labwareEntities: LabwareEntities
): void => {
  const { labware: labwareState, liquidState } = robotState
  const fullStackOnVacuum = getFullStackFromLabwares(labwareState, moduleId)
  const pipettableLabwareOnVacuumTopDown = fullStackOnVacuum.filter(
    lwId =>
      lwId in labwareEntities &&
      getIsPipettableLabware(labwareEntities[lwId].def)
  )
  // assume sole filter plate if only one pipettable lw on vacuum during pump action
  if (pipettableLabwareOnVacuumTopDown.length === 1) {
    const liquidLabwareState =
      liquidState.labware[pipettableLabwareOnVacuumTopDown[0]]
    Object.entries(liquidLabwareState).forEach(([well, _]) => {
      liquidLabwareState[well] = {}
    })
    return
  }
  if (pipettableLabwareOnVacuumTopDown.length === 2) {
    const filterLwId = pipettableLabwareOnVacuumTopDown[0]
    const collectionLwId = pipettableLabwareOnVacuumTopDown[1]
    if (
      !getLabwareDimensionsEqual(
        labwareEntities[filterLwId].def,
        labwareEntities[collectionLwId].def
      )
    ) {
      return
    }
    const filterLwLiquidState = liquidState.labware[filterLwId]
    const collectionLwLiquidState = liquidState.labware[collectionLwId]

    // merge filter well ingredients into collection
    Object.entries(collectionLwLiquidState).forEach(
      ([well, collectionWellState]) => {
        const filterWellState = filterLwLiquidState[well]
        Object.entries(filterWellState).forEach(([ingredGroup, { volume }]) => {
          collectionWellState[ingredGroup] = {
            volume:
              ingredGroup in collectionWellState
                ? collectionWellState[ingredGroup].volume + volume
                : volume,
          }
        })
        // empty filter plate well
        filterLwLiquidState[well] = {}
      }
    )
  }
}

export const forVacuumOpenVent = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState != null) {
    moduleState.ventStatus = VACUUM_VENT_OPEN
  }
}

export const forVacuumCloseVent = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    return
  }
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState != null) {
    moduleState.ventStatus = VACUUM_VENT_CLOSED
  }
}

export const forVacuumSetPumpPressure = (
  params: VacuumSetPumpPressureStepGenArgs & { taskId?: string | null },
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters, labwareEntities } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const gaugePressure = resolveNumericRuntimeValue(
    params.gaugePressure,
    runtimeParameters
  )
  const duration =
    params.duration == null
      ? undefined
      : resolveNumericRuntimeValue(params.duration, runtimeParameters)
  const ventAfter =
    params.ventAfter == null
      ? true
      : resolveBooleanRuntimeValue(params.ventAfter, runtimeParameters)
  if (
    moduleId == null ||
    gaugePressure == null ||
    duration === null ||
    ventAfter == null
  ) {
    return
  }
  const { taskId } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState == null) {
    return
  }

  vacuumMergeLiquid(moduleId, robotState, labwareEntities)

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
  moduleState.ventStatus = VACUUM_VENT_CLOSED
}

export const forVacuumSetPumpPower = (
  params: VacuumSetPumpPowerStepGenArgs & { taskId?: string | null },
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters, labwareEntities } = invariantContext
  const moduleId = resolveStringRuntimeValue(params.moduleId, runtimeParameters)
  const percentPower = resolveNumericRuntimeValue(
    params.percentPower,
    runtimeParameters
  )
  const duration =
    params.duration == null
      ? undefined
      : resolveNumericRuntimeValue(params.duration, runtimeParameters)
  const ventAfter =
    params.ventAfter == null
      ? true
      : resolveBooleanRuntimeValue(params.ventAfter, runtimeParameters)
  if (
    moduleId == null ||
    percentPower == null ||
    duration === null ||
    ventAfter == null
  ) {
    return
  }
  const { taskId } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  if (moduleState == null) {
    return
  }

  vacuumMergeLiquid(moduleId, robotState, labwareEntities)

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
  moduleState.ventStatus = VACUUM_VENT_CLOSED
}

export const forVacuumStopPump = (
  params: ModuleStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const moduleId = resolveStringRuntimeValue(
    params.moduleId,
    invariantContext.runtimeParameters
  )
  if (moduleId == null) {
    return
  }
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
  const { labwareEntities } = invariantContext
  const moduleState = vacuumModuleStateGetter(robotState, moduleId)
  // taskId should not be null, but this is to satisfy type checks
  if (moduleState == null || taskId == null) {
    return
  }

  vacuumMergeLiquid(moduleId, robotState, labwareEntities)

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
