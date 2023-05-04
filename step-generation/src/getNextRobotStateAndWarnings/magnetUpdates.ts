import { getModuleState } from '../robotStateSelectors'
import type {
  InvariantContext,
  ModuleTemporalProperties,
  RobotStateAndWarnings,
} from '../types'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import type {
  EngageMagnetParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

function _setMagnet(
  moduleState: ModuleTemporalProperties['moduleState'],
  engaged: boolean
): void {
  if (moduleState.type === MAGNETIC_MODULE_TYPE) {
    moduleState.engaged = engaged
  }
}

export function forEngageMagnet(
  params: EngageMagnetParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = getModuleState(robotState, moduleId)

  _setMagnet(moduleState, true)
}
export function forDisengageMagnet(
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { moduleId } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = getModuleState(robotState, moduleId)

  _setMagnet(moduleState, false)
}
