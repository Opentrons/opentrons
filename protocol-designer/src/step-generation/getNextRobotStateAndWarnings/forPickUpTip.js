// @flow
import assert from 'assert'
import { getIsTiprack } from '@opentrons/shared-data'
import type { PipetteAccessParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forPickUpTip(
  params: PipetteAccessParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipette, labware, well } = params

  const pipetteSpec = invariantContext.pipetteEntities[pipette].spec
  const tiprackDef = invariantContext.labwareEntities[labware].def
  assert(
    getIsTiprack(tiprackDef),
    `forPickUpTip expected ${labware} to be a tiprack`
  )

  const tipState = robotStateAndWarnings.robotState.tipState

  // pipette now has tip(s)
  tipState.pipettes[pipette] = true

  // remove tips from tiprack
  if (pipetteSpec.channels === 1) {
    tipState.tipracks[labware][well] = false
  } else if (pipetteSpec.channels === 8) {
    const allWells = tiprackDef.ordering.find(col => col[0] === well)
    if (!allWells) {
      // TODO Ian 2018-04-30 return {errors}, don't throw
      throw new Error('Invalid primary well for tip pickup: ' + well)
    }
    allWells.forEach(function(well) {
      tipState.tipracks[labware][well] = false
    })
  }
}
