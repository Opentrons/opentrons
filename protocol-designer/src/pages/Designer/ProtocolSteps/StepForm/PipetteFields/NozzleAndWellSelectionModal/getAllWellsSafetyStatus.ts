import { COLUMN, ROW } from '@opentrons/shared-data'
import { getIsSafePipetteMovement } from '@opentrons/step-generation'

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
    primaryNozzle,
    nozzleConfiguration,
  } = args

  const allWellsWithStatus: Record<string, number> = {}

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
          })
        : true

      // mark all wells in this row
      allWells.forEach(column => {
        allWellsWithStatus[column[rowIndex]] = safe ? 0 : 1
      })
    }
  } else if (nozzleConfiguration === COLUMN) {
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
          })
        : true

      column.forEach(wellName => {
        allWellsWithStatus[wellName] = safe ? 0 : 1
      })
    }
  } else {
    // SINGLE nozzle: check every well individually
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
          })
        : true
      allWellsWithStatus[wellName] = safe ? 0 : 1
    })
  }

  return allWellsWithStatus
}
