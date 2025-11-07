import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  getModuleDef,
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

  const moduleDefinition = getModuleDef(FLEX_STACKER_MODULE_V1)
  const maxStorableLabware = getStackerMaxPoolCountByHeight(
    FLEX_STACKER_MODULE_V1,
    moduleDefinition.dimensions.maxStackerFillHeight ?? 0,
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
    moduleState.shuttlePosition = 'retrieved'
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
