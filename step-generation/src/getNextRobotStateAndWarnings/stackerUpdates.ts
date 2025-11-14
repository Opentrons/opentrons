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
      moduleState.labwareIdsInStacker =
        moduleState?.labwareIdsInStacker?.splice(
          moduleState?.labwareIdsInStacker?.length - 1 - count
        ) ?? null
    } else {
      moduleState.labwareIdsInStacker = null
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
    invariantContext.labwareEntities[
      moduleState?.labwareIdsInStacker?.[0] ?? ''
    ]?.def
  const listOfLabwareDefinitions = Array.from(
    { length: moduleState?.labwareIdsInStacker?.length ?? 0 },
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
      maxStorableLabware >
        count + (moduleState.labwareIdsInStacker?.length ?? 0)
    ) {
      // create labware entities for the new labware
      const newLabwareIdList = Array.from({ length: count }, () => uuid())
      moduleState.labwareIdsInStacker = [
        ...(moduleState.labwareIdsInStacker ?? []),
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
    if (moduleState.shuttlePosition === 'retrieved') {
      throw new Error(
        'Cannot retrieve labware bc there is labware on the shuttle'
      )
    }
    if (moduleState.labwareIdsInStacker?.length === 0) {
      throw new Error(
        'Cannot retrieve labware bc there is no labware in the stacker'
      )
    }
    if (moduleState.storedLabwareDetails?.primaryLabware == null)
      throw new Error(
        'Cannot retrieve labware bc there is no stored labware details or primary labware'
      )
  }

  moduleState!.shuttlePosition = 'retrieved'

  const retrievedLabware = moduleState?.labwareIdsInStacker?.shift()
  if (retrievedLabware == null) {
    throw new Error(
      'Cannot retrieve labware bc there is no labware in the stacker'
    )
  }
  // change slot to shuttle slot
  // create labware entity for retrieved labware
  robotState.labware[retrievedLabware] = {
    ...robotState.labware[retrievedLabware],
    stack: robotState.labware[retrievedLabware]?.stack?.slice(0, -1) ?? [],
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
    if (moduleState.shuttlePosition === 'stored') {
      throw new Error('Cannot store labware bc there is labware on the shuttle')
    }
    // get module location
    const moduleLocation = robotState.modules[moduleId]?.slot
    if (moduleLocation == null) {
      throw new Error('Cannot store labware bc there is no module location')
    }
    if (moduleState.storedLabwareDetails?.primaryLabware == null) {
      throw new Error('Cannot store labware bc there is no labware stored')
    }
    if (
      (moduleState.labwareIdsInStacker?.length ?? 0) + 1 >
      moduleState.maxPoolCount
    ) {
      throw new Error(
        'Cannot store labware bc there is no space in the stacker'
      )
    }
    // get labware id on module from the move labware command
    const newLabwareId = uuid()
    const moduleOnSlot = robotState.modules[moduleId].slot
    // move labware should update the labware id on the shuttle
    const labwareToStore = Object.entries(robotState.labware).find(
      ([_, labware]) => labware.stack.includes(moduleOnSlot)
    )?.[0]
    if (labwareToStore == null) {
      throw new Error(
        'Cannot store labware bc there is no labware on the module'
      )
    }
    moduleState.shuttlePosition = 'stored'
    moduleState.labwareIdsInStacker = [
      newLabwareId,
      ...(moduleState.labwareIdsInStacker ?? []),
    ]
    // remove labware from entities and from shuttle
    // update stack of labware on the module
  }
}
