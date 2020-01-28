// @flow
import assert from 'assert'
import { getModuleState } from '../utils/misc'
import type {
  EngageMagnetParams,
  DisengageMagnetParams,
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
  assert(
    module in robotState.modules,
    `forEngageMagnet expected module id "${module}"`
  )
  _setMagnet(moduleState, true)
}

export function forDisengageMagnet(
  params: DisengageMagnetParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { module } = params
  const { robotState } = robotStateAndWarnings
  const moduleState = getModuleState(robotState, module)
  assert(
    module in robotState.modules,
    `forDisengageMagnet expected module id "${module}"`
  )
  _setMagnet(moduleState, false)
}
