// @flow
import assert from 'assert'
import { getModuleState } from '../robotStateSelectors'
import type {
  EngageMagnetParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { InvariantContext, RobotStateAndWarnings } from '../types'
import { MAGDECK } from '../../constants'

function _setMagnet(moduleState, engaged) {
  if (moduleState.type === MAGDECK) {
    moduleState.engaged = engaged
  }
}

export function forEngageMagnet(
  params: EngageMagnetParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { module } = params
  let { robotState } = robotStateAndWarnings
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
