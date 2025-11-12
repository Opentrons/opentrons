import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  getHeightOfLabwareStackFromDefinitions,
  getLabwareOverlapOffset,
  getStackerMaxPoolCountByHeight,
} from '@opentrons/shared-data'

import { getModuleState } from '../robotStateSelectors'
import { uuid } from '../utils'
import { getIsSlotOccupied } from '../utils/stackerUtils'

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
      moduleState.labwareInStacker =
        moduleState?.labwareInStacker?.splice(
          moduleState?.labwareInStacker?.length - 1 - count
        ) ?? null
    } else {
      moduleState.labwareInStacker = null
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
    invariantContext.labwareEntities[moduleState?.labwareStored ?? '']?.def
  const listOfLabwareDefinitions = Array.from(
    { length: moduleState?.labwareInStacker?.length ?? 0 },
    _ => labwareDefinition
  )
  const poolHeight = getHeightOfLabwareStackFromDefinitions(
    listOfLabwareDefinitions
  )
  const maxStorableLabware = getStackerMaxPoolCountByHeight(
    FLEX_STACKER_MODULE_V1,
    poolHeight,
    getLabwareOverlapOffset(
      FLEX_STACKER_MODULE_V1,
      labwareDefinition,
      'default'
    ).z
  )

  if (moduleState != null) {
    if (
      count != null &&
      count > 0 &&
      maxStorableLabware > count + (moduleState.labwareInStacker?.length ?? 0)
    ) {
      // create labware entities for the new labware
      const newLabwareIdList = Array.from({ length: count }, () => uuid())
      moduleState.labwareInStacker = [
        ...(moduleState.labwareInStacker ?? []),
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
    if (moduleState.labwareInStacker?.length === 0) {
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

  const retrievedLabware = moduleState?.labwareInStacker?.shift()
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
    moduleState.shuttlePosition = 'stored'
  }
}
