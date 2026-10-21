import { ALL, COLUMN, getIsTiprack, SINGLE } from '@opentrons/shared-data'

import { DIRTY } from '../constants'
import { getNozzleConfig, resolveStringRuntimeValue } from '../utils'

import type {
  DropTipStepGenArgs,
  InvariantContext,
  RobotStateAndWarnings,
} from '../types'

export function forDropTip(
  params: DropTipStepGenArgs,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(params.pipette, runtimeParameters)
  const labwareId =
    params.dropTipLocation == null
      ? undefined
      : resolveStringRuntimeValue(params.dropTipLocation, runtimeParameters)
  const wellName =
    params.wellName == null
      ? undefined
      : resolveStringRuntimeValue(params.wellName, runtimeParameters)
  if (
    pipetteId == null ||
    (params.dropTipLocation != null && labwareId == null) ||
    (params.wellName != null && wellName == null)
  ) {
    console.error(
      `forDropTip: arg resolved to null (pipetteId=${String(
        pipetteId
      )}, labwareId=${String(labwareId)}, wellName=${String(wellName)})`
    )
    return
  }
  const { robotState } = robotStateAndWarnings
  robotState.tipState.pipettes[pipetteId].hasTip = false
  robotState.tipState.pipettes[pipetteId].tiprackURI = null
  robotState.pipettes[pipetteId].tiprackId = undefined

  // add dirty tip to tiprack
  const tipState = robotState.tipState
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const nozzles = robotState.pipettes[pipetteId].nozzles
  const nozzleConfiguration = getNozzleConfig(nozzles, pipetteSpec)
  const getTiprackColumnForWell = (
    ordering: string[][],
    targetWellName: string
  ): string[] | undefined =>
    ordering.find(column => column.includes(targetWellName))
  const tiprackDef =
    labwareId == null
      ? undefined
      : invariantContext.labwareEntities[labwareId]?.def
  if (
    labwareId == null ||
    wellName == null ||
    tiprackDef == null ||
    !getIsTiprack(tiprackDef)
  ) {
    //  early exit if the labware isn't a tiprack or dropping tip into the fixedTrash
    console.warn(
      `forDropTip expected ${labwareId} to have definition and to be a tiprack`
    )
  } else {
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

    // set pipette most recently accessed labware and well
    robotState.pipettes[pipetteId].entityId = labwareId
    robotState.pipettes[pipetteId].wellName = wellName
  }
}
