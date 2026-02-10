import assert from 'assert'

import { ALL, COLUMN, getIsTiprack, SINGLE } from '@opentrons/shared-data'

import { EMPTY } from '../constants'
import { getNozzleConfig } from '../utils'

import type { PickUpTipParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forPickUpTip(
  params: PickUpTipParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, labwareId, wellName } = params
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const tiprackDef = invariantContext.labwareEntities[labwareId].def
  assert(
    getIsTiprack(tiprackDef),
    `forPickUpTip expected ${labwareId} to be a tiprack`
  )
  const tipState = robotStateAndWarnings.robotState.tipState
  const nozzles = robotStateAndWarnings.robotState.pipettes[pipetteId].nozzles
  const nozzleConfiguration = getNozzleConfig(nozzles, pipetteSpec)
  const getTiprackColumnForWell = (
    ordering: string[][],
    targetWellName: string
  ): string[] | undefined =>
    ordering.find(column => column.includes(targetWellName))
  // pipette now has tip(s)
  tipState.pipettes[pipetteId].hasTip = true
  tipState.pipettes[pipetteId].tiprackURI = labwareId
  // remove tips from tiprack
  if (nozzleConfiguration === SINGLE) {
    tipState.tipracks[labwareId][wellName] = EMPTY
  } else if (nozzleConfiguration === COLUMN) {
    const allWells = getTiprackColumnForWell(tiprackDef.ordering, wellName)
    if (allWells == null) {
      // TODO Ian 2018-04-30 return {errors}, don't throw
      throw new Error('Invalid primary well for tip pickup: ' + wellName)
    }

    allWells.forEach(function (wellName) {
      tipState.tipracks[labwareId][wellName] = EMPTY
    })
  } else if (nozzleConfiguration === ALL) {
    if (pipetteSpec.channels === 96) {
      const allTips: string[] = tiprackDef.ordering.reduce(
        (acc, wells) => acc.concat(wells),
        []
      )
      allTips.forEach(function (wellName) {
        tipState.tipracks[labwareId][wellName] = EMPTY
      })
    } else {
      const allWells = getTiprackColumnForWell(tiprackDef.ordering, wellName)
      if (allWells == null) {
        // TODO Ian 2018-04-30 return {errors}, don't throw
        throw new Error('Invalid primary well for tip pickup: ' + wellName)
      }
      allWells.forEach(function (wellName) {
        tipState.tipracks[labwareId][wellName] = EMPTY
      })
    }
  } else {
    // Fallback for unexpected nozzle configurations.
    if (pipetteSpec.channels === 1) {
      tipState.tipracks[labwareId][wellName] = EMPTY
    } else if (pipetteSpec.channels === 96) {
      const allTips: string[] = tiprackDef.ordering.reduce(
        (acc, wells) => acc.concat(wells),
        []
      )
      allTips.forEach(function (wellName) {
        tipState.tipracks[labwareId][wellName] = EMPTY
      })
    } else {
      const allWells = getTiprackColumnForWell(tiprackDef.ordering, wellName)
      if (allWells == null) {
        // TODO Ian 2018-04-30 return {errors}, don't throw
        throw new Error('Invalid primary well for tip pickup: ' + wellName)
      }
      allWells.forEach(function (wellName) {
        tipState.tipracks[labwareId][wellName] = EMPTY
      })
    }
  }
  // update tiprackID assosciated with pipette for configureNozzleLayout
  robotStateAndWarnings.robotState.pipettes[pipetteId].tiprackId = labwareId
  robotStateAndWarnings.robotState.pipettes[pipetteId].tipWell = wellName
}
