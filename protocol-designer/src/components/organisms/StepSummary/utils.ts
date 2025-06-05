import first from 'lodash/first'
import last from 'lodash/last'

import { AIR } from '@opentrons/step-generation'

import type { RobotState } from '@opentrons/step-generation'

export const getWellsForStepSummary = (
  targetWells: string[],
  labwareWells: string[]
): string => {
  if (targetWells.length === 1) {
    return targetWells[0]
  }
  const firstElementIndexOffset = labwareWells.indexOf(targetWells[0])
  const isInOrder = targetWells.every(
    (targetWell, i) =>
      labwareWells.indexOf(targetWell) === firstElementIndexOffset + i
  )
  return isInOrder
    ? `${first(targetWells)}-${last(targetWells)}`
    : `${targetWells.length} wells`
}

export const getLiquidIdsForStepSummary = (
  liquidState: RobotState['liquidState'],
  labwareId: string,
  wells: string[]
): string[] => {
  return Array.from(
    wells.reduce<Set<string>>((acc, well) => {
      for (const [liquidId, { volume }] of Object.entries(
        liquidState.labware[labwareId]?.[well] ?? {}
      )) {
        if (liquidId !== AIR && volume > 0) {
          acc.add(liquidId)
        }
      }
      return acc
    }, new Set<string>())
  )
}
