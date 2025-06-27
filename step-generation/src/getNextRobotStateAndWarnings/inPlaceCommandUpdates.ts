import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'

import type {
  BlowoutInPlaceParams,
  DropTipInPlaceParams,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export const forBlowOutInPlace = (
  params: BlowoutInPlaceParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { pipetteId } = params
  const { robotState } = robotStateAndWarnings
  const entityId = robotState.pipettes[pipetteId].entityId ?? ''

  dispenseUpdateLiquidState({
    invariantContext,
    pipetteId,
    prevLiquidState: robotState.liquidState,
    useFullVolume: true,
    robotStateAndWarnings,
    entityId,
  })
}

export const forDropTipInPlace = (
  params: DropTipInPlaceParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { pipetteId } = params
  const { robotState } = robotStateAndWarnings
  const entityId = robotState.pipettes[pipetteId].entityId ?? ''
  robotState.tipState.pipettes[pipetteId] = {
    hasTip: false,
    tiprackURI: null,
  }
  robotState.pipettes[pipetteId].tiprackId = undefined

  dispenseUpdateLiquidState({
    invariantContext,
    prevLiquidState: robotState.liquidState,
    pipetteId,
    useFullVolume: true,
    robotStateAndWarnings,
    entityId,
  })
}
