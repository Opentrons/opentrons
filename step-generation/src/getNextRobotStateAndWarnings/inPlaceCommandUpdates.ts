import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { AspirateInPlaceArgs } from '../commandCreators/atomic/aspirateInPlace'
import type { BlowOutInPlaceArgs } from '../commandCreators/atomic/blowOutInPlace'
import type { DispenseInPlaceArgs } from '../commandCreators/atomic/dispenseInPlace'
import type { DropTipInPlaceArgs } from '../commandCreators/atomic/dropTipInPlace'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export const forAspirateInPlace = (
  params: AspirateInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  //   TODO(jr, 11/6/23): update state
}

export const forDispenseInPlace = (
  params: DispenseInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { pipetteId, volume } = params
  const { robotState } = robotStateAndWarnings
  dispenseUpdateLiquidState({
    invariantContext,
    pipetteId,
    prevLiquidState: robotState.liquidState,
    useFullVolume: false,
    volume,
  })
}

export const forBlowOutInPlace = (
  params: BlowOutInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { pipetteId } = params
  const { robotState } = robotStateAndWarnings
  dispenseUpdateLiquidState({
    invariantContext,
    pipetteId,
    prevLiquidState: robotState.liquidState,
    useFullVolume: true,
  })
}

export const forDropTipInPlace = (
  params: DropTipInPlaceArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { pipetteId } = params
  const { robotState } = robotStateAndWarnings
  robotState.tipState.pipettes[pipetteId] = false

  dispenseUpdateLiquidState({
    invariantContext,
    prevLiquidState: robotState.liquidState,
    pipetteId,
    useFullVolume: true,
  })
}
