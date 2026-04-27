import { ALL, COLUMN, ROW } from '@opentrons/shared-data'
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
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const labwareDef = invariantContext.labwareEntities[labwareId].def
  const channels = pipetteSpec.channels
  const is384Plate = labwareDef.ordering.flat().length === 384
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
          })
        : true

      // mark all wells in this row
      allWells.forEach(column => {
        allWellsWithStatus[column[rowIndex]] = safe ? 0 : 1
      })
    }
  } else if (
    nozzleConfiguration === COLUMN ||
    (channels === 8 && nozzleConfiguration === ALL) ||
    (channels === 1 && nozzleConfiguration === ALL && is384Plate)
  ) {
    // 384: two vertical staggers per column. Reuse the same even/odd grouping for
    // 8-channel ALL, COLUMN (e.g. 96ch on 384), and single-channel ALL on 384 only —
    // PD only offers ALL for 1ch; per-well checks are overly pessimistic at tight Y pitch.
    const use384ColumnStagger =
      is384Plate &&
      (nozzleConfiguration === COLUMN ||
        (nozzleConfiguration === ALL && (channels === 1 || channels === 8)))

    for (let colIndex = 0; colIndex < allWells.length; colIndex++) {
      const column = allWells[colIndex]

      // 384-well plates: two staggered groups per column (even / odd row index).
      // Using only column[0] marks both groups with the same safety and can wrongly
      // block the whole plate on OT-2 when the second stagger is actually reachable.
      if (use384ColumnStagger) {
        const safeEvenStagger = robotState
          ? getIsSafePipetteMovement({
              robotState,
              invariantContext,
              pipetteId,
              labwareId,
              wellTargetName: column[0],
              primaryNozzle,
              nozzleConfiguration,
            })
          : true
        const safeOddStagger = robotState
          ? getIsSafePipetteMovement({
              robotState,
              invariantContext,
              pipetteId,
              labwareId,
              wellTargetName: column[1],
              primaryNozzle,
              nozzleConfiguration,
            })
          : true

        column.forEach((wellName, rowIdx) => {
          const safe = rowIdx % 2 === 0 ? safeEvenStagger : safeOddStagger
          allWellsWithStatus[wellName] = safe ? 0 : 1
        })
      } else {
        // COLUMN mode (96-well columns) or 8-channel ALL on 96: one pose per column.
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
        })
      : true
    allWells.flat().forEach(wellName => {
      allWellsWithStatus[wellName] = safe ? 0 : 1
    })
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
