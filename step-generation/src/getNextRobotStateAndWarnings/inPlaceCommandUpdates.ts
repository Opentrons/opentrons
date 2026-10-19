import { resolveStringRuntimeValue } from '../utils'
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'

import type { DropTipInPlaceParams } from '@opentrons/shared-data'
import type {
  BlowOutInPlaceStepGenArgs,
  InvariantContext,
  RobotStateAndWarnings,
} from '../types'

export const forBlowOutInPlace = (
  params: BlowOutInPlaceStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(
    params.pipetteId,
    runtimeParameters
  )
  if (pipetteId == null) {
    console.error(
      `forBlowOutInPlace: arg resolved to null (pipetteId=${String(pipetteId)})`
    )
    return
  }
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

  dispenseUpdateLiquidState({
    invariantContext,
    prevLiquidState: robotState.liquidState,
    pipetteId,
    useFullVolume: true,
    robotStateAndWarnings,
    entityId,
  })

  robotState.pipettes[pipetteId].tiprackId = undefined
}
