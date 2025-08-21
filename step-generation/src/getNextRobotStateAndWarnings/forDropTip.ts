import assert from 'assert'

import { ALL, COLUMN, getIsTiprack, SINGLE } from '@opentrons/shared-data'

import { DIRTY } from '../constants'

import type { DropTipParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

//  NOTE(jr, 12/1/23): this state update is not in use currently for PD 8.0
//  since we only support dropping tip into the waste chute or trash bin
//  which are both addressableAreas (so the commands are moveToAddressableArea
//  and dropTipInPlace) We will use this again when we add return tip.
export function forDropTip(
  params: DropTipParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, wellName, labwareId } = params
  const { robotState } = robotStateAndWarnings
  robotState.tipState.pipettes[pipetteId].hasTip = false
  robotState.tipState.pipettes[pipetteId].tiprackURI = null
  robotState.pipettes[pipetteId].tiprackId = undefined

  // add dirty tip to tiprack
  const tipState = robotState.tipState
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const nozzles = robotStateAndWarnings.robotState.pipettes[pipetteId].nozzles
  const tiprackDef = invariantContext.labwareEntities[labwareId].def
  assert(
    tiprackDef != null && getIsTiprack(tiprackDef),
    `forDropTip expected ${labwareId} to have definition and to be a tiprack`
  )

  // TODO (nd 08/12/2025): handle tip (re)placement more elegantly depending on pipette specs and selected nozzles
  if (pipetteSpec.channels === 1 || nozzles === SINGLE) {
    tipState.tipracks[labwareId][wellName] = DIRTY
  } else if (pipetteSpec.channels === 8 || nozzles === COLUMN) {
    const allWells = tiprackDef.ordering.find(col => col[0] === wellName) ?? []
    allWells.forEach(
      wellName => (tipState.tipracks[labwareId][wellName] = DIRTY)
    )
  } else if (pipetteSpec.channels === 96 && nozzles === ALL) {
    const allTips: string[] = tiprackDef.ordering.reduce(
      (acc, wells) => acc.concat(wells),
      []
    )
    allTips.forEach(function (wellName) {
      tipState.tipracks[labwareId][wellName] = DIRTY
    })
  }

  // set pipette most recently accessed labware and well
  robotState.pipettes[pipetteId].entityId = labwareId
  robotState.pipettes[pipetteId].wellName = wellName
}
