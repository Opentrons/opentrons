// @flow
import type { RobotState, CommandCreatorWarning } from './'

type LiquidState = $PropertyType<RobotState, 'liquidState'>

type LiquidStateAndWarnings = {
  liquidState: LiquidState,
  warnings: Array<CommandCreatorWarning>,
}

// TODO IMMEDIATELY: replace 'forAspirateDispense' with this fn
export default function updateLiquidState(
  args: {|
    pipetteId: string,
    volume: number,
    labwareId: string,
    labwareType: string,
    well: string,
  |},
  prevLiquidState: LiquidState
): LiquidStateAndWarnings {
  throw Error('Not implemented.') // TODO IMMEDIATELY: copy logic from forAspirateDispense.js
}
