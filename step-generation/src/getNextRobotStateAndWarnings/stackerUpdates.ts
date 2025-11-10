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
  console.log('poolHeight: ', poolHeight)
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
  params: FlexStackerRetrieveParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getStackerModuleState(robotState, moduleId)
  if (moduleState != null) {
    // do i need to know the state of every stacker and every stacker in the labware or do we match step by step?
    const labwareToRetrieve = moduleState.labwareInStacker?.[0]
    const labwareLocation =
      robotState.labware[labwareToRetrieve ?? '']?.stack[
        robotState.labware[labwareToRetrieve ?? '']?.stack.length - 1
      ]
    if (labwareLocation == null) {
      throw new Error('Labware location is null')
    }
    console.log('labwareLocation: ', labwareLocation)
    console.log('robotState: ', robotState)
    console.log('invariantContext: ', invariantContext)
    // check if slot is occupied
    const deck = getIsSlotOccupied(robotState)
    if (deck.slots[labwareLocation.slotName]?.occupied) {
      throw new Error('Slot is occupied')
    }
    // update shuttle position
    moduleState.shuttlePosition = 'retrieved'
    // update labware batch
    // robotState.labware[labwareToRetrieve ?? '']?.stack = robotState.labware[labwareToRetrieve ?? '']?.stack.slice(0, -1)
    // robotState.labware[labwareToRetrieve ?? '']?.stack = [labwareLocation]
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
