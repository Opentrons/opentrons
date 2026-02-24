import { ALL, COLUMN, getIsTiprack, SINGLE } from '@opentrons/shared-data'

import { DIRTY } from '../constants'
import { getNozzleConfig } from '../utils'

import type { DropTipParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

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

  // Only mark tiprack wells dirty when dropping *into* a tiprack (return tip).
  // When dropping into other labware (e.g. plate well, trash), params.labwareId is the destination.
  const tiprackDef = invariantContext.labwareEntities[labwareId]?.def
  if (tiprackDef != null && getIsTiprack(tiprackDef)) {
    const tipState = robotState.tipState
    const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
    const nozzles = robotState.pipettes[pipetteId].nozzles
    const nozzleConfiguration = getNozzleConfig(nozzles, pipetteSpec)
    const getTiprackColumnForWell = (
      ordering: string[][],
      targetWellName: string
    ): string[] | undefined =>
      ordering.find(column => column.includes(targetWellName))

    // TODO (nd 08/12/2025): handle tip (re)placement more elegantly depending on pipette specs and selected nozzles
    if (nozzleConfiguration === SINGLE) {
      tipState.tipracks[labwareId][wellName] = DIRTY
    } else if (nozzleConfiguration === COLUMN) {
      const allWells =
        getTiprackColumnForWell(tiprackDef.ordering, wellName) ?? []
      allWells.forEach(
        wellName => (tipState.tipracks[labwareId][wellName] = DIRTY)
      )
    } else if (nozzleConfiguration === ALL) {
      if (pipetteSpec.channels === 96) {
        const allTips: string[] = tiprackDef.ordering.reduce(
          (acc, wells) => acc.concat(wells),
          []
        )
        allTips.forEach(function (wellName) {
          tipState.tipracks[labwareId][wellName] = DIRTY
        })
      } else {
        const allWells =
          getTiprackColumnForWell(tiprackDef.ordering, wellName) ?? []
        allWells.forEach(
          wellName => (tipState.tipracks[labwareId][wellName] = DIRTY)
        )
      }
    } else {
      // Fallback for unexpected nozzle configurations.
      if (pipetteSpec.channels === 1) {
        tipState.tipracks[labwareId][wellName] = DIRTY
      } else if (pipetteSpec.channels === 96) {
        const allTips: string[] = tiprackDef.ordering.reduce(
          (acc, wells) => acc.concat(wells),
          []
        )
        allTips.forEach(function (wellName) {
          tipState.tipracks[labwareId][wellName] = DIRTY
        })
      } else {
        const allWells =
          getTiprackColumnForWell(tiprackDef.ordering, wellName) ?? []
        allWells.forEach(
          wellName => (tipState.tipracks[labwareId][wellName] = DIRTY)
        )
      }
    }
  }

  // set pipette most recently accessed labware and well (drop location for viz)
  robotState.pipettes[pipetteId].entityId = labwareId
  robotState.pipettes[pipetteId].wellName = wellName
}
