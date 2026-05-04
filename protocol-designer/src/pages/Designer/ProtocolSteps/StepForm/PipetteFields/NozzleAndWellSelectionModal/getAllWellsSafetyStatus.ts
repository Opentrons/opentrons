import {
  ALL,
  COLUMN,
  PARTIAL_COLUMN,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'
import { getIsSafePipetteMovement } from '@opentrons/step-generation'

import { canPipetteUseLabware } from '../../../../../../utils'

import type {
  NozzleConfigurationStyle,
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
      const safe = robotState
        ? getIsSafePipetteMovement({
            robotState,
            invariantContext,
            pipetteId,
            labwareId,
            wellTargetName: firstWell,
            primaryNozzle,
            nozzleConfiguration,
            tiprackId,
          })
        : true

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
      const safe = robotState
        ? getIsSafePipetteMovement({
            robotState,
            invariantContext,
            pipetteId,
            labwareId,
            wellTargetName: firstWell,
            primaryNozzle,
            nozzleConfiguration,
            tiprackId,
          })
        : true

      column.forEach(wellName => {
        allWellsWithStatus[wellName] = safe ? 0 : 1
      })
    }
  } else if (nozzleConfiguration === ALL && channels === 96) {
    // ALL 96 Nozzles: only check the first well
    const safe = robotState
      ? getIsSafePipetteMovement({
          robotState,
          invariantContext,
          pipetteId,
          labwareId,
          wellTargetName: allWells[0][0],
          primaryNozzle,
          nozzleConfiguration,
          tiprackId,
        })
      : true
    allWells.flat().forEach(wellName => {
      allWellsWithStatus[wellName] = safe ? 0 : 1
    })
  } else if (
    (nozzleConfiguration === SINGLE ||
      nozzleConfiguration === PARTIAL_COLUMN) &&
    channels !== 1
  ) {
    // SINGLE nozzle for 8ch and 96ch: check every well individually
    allWells.flat().forEach(wellName => {
      const safe = robotState
        ? getIsSafePipetteMovement({
            robotState,
            invariantContext,
            pipetteId,
            labwareId,
            wellTargetName: wellName,
            primaryNozzle,
            nozzleConfiguration,
            tiprackId,
          })
        : true
      allWellsWithStatus[wellName] = safe ? 0 : 1
    })
  } else {
    // remaining case - single channel pipettes - assume all wells can be safely accessed
    allWells.flat().forEach(wellName => {
      allWellsWithStatus[wellName] = 0
    })
  }

  return allWellsWithStatus
}
