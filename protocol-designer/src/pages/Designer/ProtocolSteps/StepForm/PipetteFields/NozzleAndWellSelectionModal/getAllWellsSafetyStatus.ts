import {
  ALL,
  COLUMN,
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'
import { getPipetteMovementSafetyStatus } from '@opentrons/step-generation'

import { canPipetteUseLabware } from '../../../../../../utils'

import type {
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface GetWellSafetyArgs {
  allWells: string[][]
  robotState: RobotState | null
  invariantContext: InvariantContext
  pipetteId: string
  labwareId: string
  tiprackId?: string
  primaryNozzle: PrimaryNozzleConfigurationStyle
  nozzleConfiguration: NozzleConfigurationStyle
}

export function getAllWellsSafetyStatus(
  args: GetWellSafetyArgs
): Record<string, number> {
  const {
    allWells,
    robotState,
    invariantContext,
    pipetteId,
    labwareId,
    tiprackId,
    primaryNozzle,
    nozzleConfiguration,
  } = args

  const allWellsWithStatus: Record<string, number> = {}
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const labwareDef = invariantContext.labwareEntities[labwareId].def
  const channels = pipetteSpec.channels
  const pipetteCanUseLabware = canPipetteUseLabware(
    pipetteSpec,
    nozzleConfiguration,
    labwareDef
  )
  if (!pipetteCanUseLabware) {
    Object.assign(
      allWellsWithStatus,
      Object.fromEntries(allWells.map(well => [well, 1]))
    )
    return allWellsWithStatus
  }
  if (nozzleConfiguration === ROW) {
    // ROW mode: each row = 12 wells across
    const numRows = allWells[0].length
    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      const firstWell = allWells[0][rowIndex]
      const safe =
        robotState == null ||
        getPipetteMovementSafetyStatus({
          robotState,
          invariantContext,
          pipetteId,
          labwareId,
          wellTargetName: firstWell,
          primaryNozzle,
          nozzleConfiguration,
          tiprackId,
        }).isSafe

      // mark all wells in this row
      allWells.forEach(column => {
        allWellsWithStatus[column[rowIndex]] = safe ? 0 : 1
      })
    }
  } else if (
    nozzleConfiguration === COLUMN ||
    (channels === 8 && nozzleConfiguration === ALL)
  ) {
    // COLUMN mode: each column = 8 wells
    for (let colIndex = 0; colIndex < allWells.length; colIndex++) {
      const column = allWells[colIndex]
      const firstWell = column[0]
      const safe =
        robotState == null ||
        getPipetteMovementSafetyStatus({
          robotState,
          invariantContext,
          pipetteId,
          labwareId,
          wellTargetName: firstWell,
          primaryNozzle,
          nozzleConfiguration,
          tiprackId,
        }).isSafe

      column.forEach(wellName => {
        allWellsWithStatus[wellName] = safe ? 0 : 1
      })
    }
  } else if (nozzleConfiguration === ALL && channels === 96) {
    // ALL 96 Nozzles: only check the first well
    const safe =
      robotState == null ||
      getPipetteMovementSafetyStatus({
        robotState,
        invariantContext,
        pipetteId,
        labwareId,
        wellTargetName: allWells[0][0],
        primaryNozzle,
        nozzleConfiguration,
        tiprackId,
      }).isSafe

    allWells.flat().forEach(wellName => {
      allWellsWithStatus[wellName] = safe ? 0 : 1
    })
  } else if (nozzleConfiguration === SINGLE && channels !== 1) {
    // SINGLE nozzle for 8ch and 96ch: check every well individually
    allWells.flat().forEach(wellName => {
      const safe =
        robotState == null ||
        getPipetteMovementSafetyStatus({
          robotState,
          invariantContext,
          pipetteId,
          labwareId,
          wellTargetName: wellName,
          primaryNozzle,
          nozzleConfiguration,
          tiprackId,
        }).isSafe

      allWellsWithStatus[wellName] = safe ? 0 : 1
    })
  } else if (nozzleConfiguration === PARTIAL_COLUMN) {
    const totalSelectionLength =
      PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
    for (let colIndex = 0; colIndex < allWells.length; colIndex++) {
      const column = allWells[colIndex]
      for (let i = 0; i < column.length; i++) {
        const wellToTest = column[i]
        const safe =
          robotState == null ||
          getPipetteMovementSafetyStatus({
            robotState,
            invariantContext,
            pipetteId,
            labwareId,
            wellTargetName: wellToTest,
            primaryNozzle,
            nozzleConfiguration,
            tiprackId,
          }).isSafe

        const canFitBlock = i <= column.length - totalSelectionLength
        const labwareHasOneRow = labwareDef.ordering[0].length === 1
        if (safe && (canFitBlock || labwareHasOneRow)) {
          // 1. Mark the valid block (e.g., A1–E1)
          for (let j = 0; j < totalSelectionLength; j++) {
            const well = column[i + j]
            allWellsWithStatus[well] = 0
          }
          // 2. Continue checking the remaining wells (e.g., F1–H1)
          for (let k = i + totalSelectionLength; k < column.length; k++) {
            const remainingWell = column[k]
            const remainingSafe =
              robotState == null ||
              getPipetteMovementSafetyStatus({
                robotState,
                invariantContext,
                pipetteId,
                labwareId,
                wellTargetName: remainingWell,
                primaryNozzle,
                nozzleConfiguration,
                tiprackId,
              }).isSafe

            allWellsWithStatus[remainingWell] = remainingSafe ? 0 : 1
          }
          // Done with this column
          break
        }
        // Mark unsafe if not usable as a starting point
        allWellsWithStatus[wellToTest] = 1
      }
    }
  } else {
    // remaining case - single channel pipettes - assume all wells can be safely accessed
    allWells.flat().forEach(wellName => {
      allWellsWithStatus[wellName] = 0
    })
  }
  return allWellsWithStatus
}
