import {
  ALL,
  COLUMN,
  getIsTiprack,
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import { EMPTY } from '../constants'
import { getNozzleConfig } from '../utils'

import type {
  PartialPrimaryNozzles,
  PickUpTipParams,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forPickUpTip(
  params: PickUpTipParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, labwareId, wellName } = params
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const tiprackDef = invariantContext.labwareEntities[labwareId].def
  if (!getIsTiprack(tiprackDef)) {
    throw new Error(`forPickUpTip expected ${labwareId} to be a tiprack`)
  }
  const tipState = robotStateAndWarnings.robotState.tipState
  const nozzles = robotStateAndWarnings.robotState.pipettes[pipetteId].nozzles
  const primaryNozzle =
    robotStateAndWarnings.robotState.pipettes[pipetteId].primaryNozzle
  const nozzleConfiguration = getNozzleConfig(nozzles, pipetteSpec)

  const getTiprackColumnForWell = (
    ordering: string[][],
    targetWellName: string
  ): string[] | undefined =>
    ordering.find(column => column.includes(targetWellName))

  const getTiprackRowForWell = (
    ordering: string[][],
    targetWell: string
  ): string[] | null => {
    const columnIndex = ordering.findIndex(column =>
      column.includes(targetWell)
    )
    if (columnIndex === -1) {
      return null
    }
    const rowIndex = ordering[columnIndex].indexOf(targetWell)
    return ordering.map(column => column[rowIndex])
  }

  const getTipsForPartial = (
    ordering: string[][],
    targetWell: string
  ): string[] => {
    const numberOfTips =
      PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
    const columnIndex = ordering.findIndex(column =>
      column.includes(targetWell)
    )
    const rowIndex = ordering[columnIndex].indexOf(targetWell)
    const column = ordering[columnIndex]

    const remainingWells = column.length - rowIndex
    if (remainingWells < numberOfTips) {
      const beginning = column.length - numberOfTips
      return column.slice(beginning, column.length)
    }
    const end = rowIndex + numberOfTips
    return column.slice(rowIndex, Math.min(end, column.length))
  }
  // pipette now has tip(s)
  tipState.pipettes[pipetteId].hasTip = true
  tipState.pipettes[pipetteId].tiprackURI = labwareId
  // remove tips from tiprack
  if (nozzleConfiguration === SINGLE) {
    tipState.tipracks[labwareId][wellName] = EMPTY
  } else if (nozzleConfiguration === PARTIAL_COLUMN && primaryNozzle) {
    const partialTips = getTipsForPartial(tiprackDef.ordering, wellName)
    if (partialTips == null) {
      console.error(
        `Invalid primary well for tip pick up for partial config: ${wellName}`
      )
    } else {
      partialTips.forEach(function (wellName) {
        tipState.tipracks[labwareId][wellName] = EMPTY
      })
    }
  } else if (nozzleConfiguration === COLUMN) {
    const allWells = getTiprackColumnForWell(tiprackDef.ordering, wellName)
    if (allWells == null) {
      console.error(`Invalid primary well for tip pickup: ${wellName}`)
    }

    allWells?.forEach(function (wellName) {
      tipState.tipracks[labwareId][wellName] = EMPTY
    })
  } else if (nozzleConfiguration === ROW) {
    const wellsInRow = getTiprackRowForWell(tiprackDef.ordering, wellName)
    if (wellsInRow == null) {
      console.error('Invalid primary well for tip pickup: ' + wellName)
    }
    wellsInRow?.forEach(function (wellName) {
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
        console.error(`Invalid primary well for tip pickup: ${wellName}`)
      }
      allWells?.forEach(function (wellName) {
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
        console.error(`Invalid primary well for tip pickup: ${wellName}`)
      }
      allWells?.forEach(function (wellName) {
        tipState.tipracks[labwareId][wellName] = EMPTY
      })
    }
  }
  // update tiprackID assosciated with pipette for configureNozzleLayout
  robotStateAndWarnings.robotState.pipettes[pipetteId].tiprackId = labwareId
  robotStateAndWarnings.robotState.pipettes[pipetteId].tipWell = wellName
}
