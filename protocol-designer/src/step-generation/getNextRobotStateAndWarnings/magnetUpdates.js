// @flow
import assert from 'assert'
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
  assert(
    module in robotState.modules,
    `forEngageMagnet expected module id "${module}"`
  )
  _setMagnet(robotState.modules[module].moduleState, true)
}

export function forDisengageMagnet(
  params: DisengageMagnetParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { module } = params
  const { robotState } = robotStateAndWarnings
  assert(
    module in robotState.modules,
    `forDisengageMagnet expected module id "${module}"`
  )
  _setMagnet(robotState.modules[module].moduleState, false)
}
