import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  getHeightOfLabwareStackFromDefinitions,
  getLabwareOverlapOffset,
  getStackerMaxPoolCountByHeight,
} from '@opentrons/shared-data'

import { getModuleState } from '../robotStateSelectors'
import { uuid } from '../utils'

import type {
  FlexStackerEmptyParams,
  FlexStackerFillParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

const _getStackerModuleState = (
  robotState: RobotState,
  module: string
): FlexStackerModuleState | null => {
  const moduleState = getModuleState(robotState, module)

  if (moduleState.type === FLEX_STACKER_MODULE_TYPE) {
    return moduleState
  } else {
    console.error(
      `Flex stacker state updater expected ${module} moduleState to be flexStacker, but it was ${moduleState.type}`
    )
    return null
  }
}

export const forFlexStackerEmpty = (
  params: FlexStackerEmptyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId, count } = params
  const moduleState = _getStackerModuleState(robotState, moduleId)

  if (moduleState != null) {
    if (count != null && count > 0) {
      moduleState.labwareInHopper =
        moduleState?.labwareInHopper?.splice(
          moduleState?.labwareInHopper?.length - 1 - count
        ) ?? null
    } else {
      moduleState.labwareInHopper = null
    }
  }
}

export const forFlexStackerFill = (
  params: FlexStackerFillParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId, count } = params
  const moduleState = _getStackerModuleState(robotState, moduleId)
  const labwareDefinition =
    invariantContext.labwareEntities[moduleState?.labwareInHopper?.[0] ?? '']
      ?.def
  const listOfLabwareDefinitions = Array.from(
    { length: moduleState?.labwareInHopper?.length ?? 0 },
    _ => labwareDefinition
  )
  const poolHeight = getHeightOfLabwareStackFromDefinitions(
    listOfLabwareDefinitions
  )
  const poolOverlap = getLabwareOverlapOffset(
    FLEX_STACKER_MODULE_V1,
    labwareDefinition,
    'default'
  )
  const maxStorableLabware = getStackerMaxPoolCountByHeight(
    FLEX_STACKER_MODULE_V1,
    poolHeight,
    poolOverlap.z
  )

  if (moduleState != null) {
    if (
      count != null &&
      count > 0 &&
      maxStorableLabware > count + (moduleState.labwareInHopper?.length ?? 0)
    ) {
      // create labware entities for the new labware
      const newLabwareIdList = Array.from({ length: count }, () => uuid())
      moduleState.labwareInHopper = [
        ...(moduleState.labwareInHopper ?? []),
        ...newLabwareIdList,
      ]
    }
  }
}

export const forFlexStackerRetrieve = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getStackerModuleState(robotState, moduleId)
  if (moduleState != null) {
    if (moduleState.labwareInShuttle !== null) {
      console.error(
        'Cannot retrieve labware bc there is labware on the shuttle'
      )
      return
    }
    if (moduleState.labwareInHopper?.length === 0) {
      console.error(
        'Cannot retrieve labware bc there is no labware in the stacker'
      )
      return
    }
    if (moduleState.storedLabwareDetails?.primaryLabware == null) {
      console.error(
        'Cannot retrieve labware bc there is no stored labware details or primary labware'
      )
      return
    }
    const labwareToRetrieve = moduleState?.labwareInHopper?.shift() ?? null
    moduleState.labwareInShuttle = labwareToRetrieve

    if (labwareToRetrieve == null) {
      console.error(
        'Cannot retrieve labware bc there is no labware in the stacker'
      )
      return
    }
    // create labware entity for retrieved labware
    robotState.labware[labwareToRetrieve ?? ''] = {
      ...robotState.labware[labwareToRetrieve ?? ''],
      stack:
        robotState.labware[labwareToRetrieve ?? '']?.stack?.slice(0, -1) ?? [],
    }
  }
}

export const forFlexStackerStore = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getStackerModuleState(robotState, moduleId)
  if (moduleState != null) {
    if (moduleState.labwareInShuttle !== null) {
      console.error('Cannot store labware bc there is labware on the shuttle')
    }
    // get module location
    const moduleLocation = robotState.modules[moduleId]?.slot
    if (moduleLocation == null) {
      console.error('Cannot store labware bc there is no module location')
    }
    if (moduleState.storedLabwareDetails?.primaryLabware == null) {
      console.error('Cannot store labware bc there is no labware stored')
    }
    if (
      (moduleState.labwareInHopper?.length ?? 0) + 1 >
      moduleState.maxPoolCount
    ) {
      console.error('Cannot store labware bc there is no space in the stacker')
    }
    // TODO: use the labware id on the module from the move labware command
    const newLabwareId = uuid()
    const moduleOnSlot = robotState.modules[moduleId].slot
    const labwareToStore = Object.entries(robotState.labware).find(
      ([_, labware]) => labware.stack.includes(moduleOnSlot)
    )?.[0]
    if (labwareToStore == null) {
      console.error('Cannot store labware bc there is no labware on the module')
    }
    moduleState.labwareInShuttle = null
    moduleState.labwareInHopper = [
      newLabwareId,
      ...(moduleState.labwareInHopper ?? []),
    ]
    // remove labware from entities
    // update stack of labware on the module
  }
}
