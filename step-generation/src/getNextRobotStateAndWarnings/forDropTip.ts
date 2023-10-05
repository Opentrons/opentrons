import { FLEX_TRASH_DEF_URI, OT_2_TRASH_DEF_URI } from '..'
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'
import type { DropTipParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forDropTip(
  params: DropTipParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, wellName } = params
  const trashId = Object.values(invariantContext.labwareEntities).find(
    lw =>
      lw.labwareDefURI === FLEX_TRASH_DEF_URI ||
      lw.labwareDefURI === OT_2_TRASH_DEF_URI
  )?.id

  if (trashId == null) {
    console.error(
      `expected to find trash id ${trashId} in labware entities but could not`
    )
  }
  const { robotState } = robotStateAndWarnings
  //  TODO(jr, 10/02/23): wire this up properly when we support dispensing into waste chute
  //  i honestly am not sure why we even need to update the liquid state for dropping tip? I guess
  //  it is to account for if a user diliberately drops tip with liquid still in it which I didn't realize
  //  is supported into PD???? Maybe it is error handling?
  dispenseUpdateLiquidState({
    invariantContext,
    prevLiquidState: robotState.liquidState,
    pipetteId,
    labwareId: trashId ?? '',
    useFullVolume: true,
    wellName,
  })
  robotState.tipState.pipettes[pipetteId] = false
}
