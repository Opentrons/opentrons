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
