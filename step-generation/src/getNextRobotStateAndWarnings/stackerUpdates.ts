import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'

import { getModuleState } from '../robotStateSelectors'

import type {
  FlexStackerSetStoredLabwareParams,
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

export const forFlexStackerOpenLatch = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getStackerModuleState(robotState, moduleId)

  if (moduleState != null) {
    moduleState.latchOpen = true
  }
}

export const forFlexStackerCloseLatch = (
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = _getStackerModuleState(robotState, moduleId)

  if (moduleState != null) {
    moduleState.latchOpen = false
  }
}

export const forFlexStackerSetStoredLabware = (
  params: FlexStackerSetStoredLabwareParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const {
    moduleId,
    adapterLabware,
    lidLabware,
    primaryLabware,
    initialCount,
    initialStoredLabware,
  } = params

  const moduleState = _getStackerModuleState(robotState, moduleId)
  if (moduleState != null) {
    moduleState.storedLabwareDetails = params
  }
}
