import { getModuleState } from '../robotStateSelectors'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import type {
  EngageMagnetParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data/lib/protocol/types/schemaV4'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

// @ts-expect-error(SA, 2021-05-03): function parameters have implicit any types
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function _setMagnet(moduleState, engaged) {
  if (moduleState.type === MAGNETIC_MODULE_TYPE) {
    moduleState.engaged = engaged
  }
}

export function forEngageMagnet(
  params: EngageMagnetParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { module } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = getModuleState(robotState, module)

  _setMagnet(moduleState, true)
}
export function forDisengageMagnet(
  params: ModuleOnlyParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { module } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = getModuleState(robotState, module)

  _setMagnet(moduleState, false)
}
