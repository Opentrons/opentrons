import reduce from 'lodash/reduce'

import type { LoadLiquidRunTimeCommand, RunTimeCommand } from '../../command'

export const consolidateSharedWells = (
  liquidsByIdForLabware: LabwareByLiquidId
): LabwareByLiquidId => {
  interface WellVolumeEntry {
    labwareId: string
    volume: number
    liquidId: string
  }
  const wellToLabwareVolumes: Record<string, WellVolumeEntry[]> = {}

  // Track all wells with their labware, volume, and source liquid
  for (const [liquidId, labwareArray] of Object.entries(
    liquidsByIdForLabware
  )) {
    for (const labware of labwareArray) {
      for (const [well, volume] of Object.entries(labware.volumeByWell)) {
        if (!wellToLabwareVolumes[well]) wellToLabwareVolumes[well] = []
        wellToLabwareVolumes[well].push({
          labwareId: labware.labwareId,
          volume,
          liquidId,
        })
      }
    }
  }

  // Identify overlapping wells
  const overlappingWells = Object.entries(wellToLabwareVolumes).filter(
    ([, entries]) => entries.length > 1
  )
  const consolidatedWells: LabwareByLiquidId = {}

  for (const [well, entries] of overlappingWells) {
    let totalVolume = 0
    let labwareIdName = ''
    const liquidIds = entries.map(e => e.liquidId).sort()
    const mixedLiquidId = `mixed-${liquidIds.join('-')}`

    for (const entry of entries) {
      totalVolume += entry.volume
      labwareIdName = entry.labwareId
    }
    if (!consolidatedWells[mixedLiquidId]) {
      consolidatedWells[mixedLiquidId] = [
        {
          labwareId: labwareIdName,
          volumeByWell: {},
        },
      ]
    }
    const existingEntry = consolidatedWells[mixedLiquidId][0]
    existingEntry.volumeByWell[well] = totalVolume
  }
  // Remove consolidated wells from the original liquids
  const cleanedOriginal: LabwareByLiquidId = {}

  for (const [liquidId, labwareArray] of Object.entries(
    liquidsByIdForLabware
  )) {
    for (const labware of labwareArray) {
      const remainingWells: Record<string, number> = {}

      for (const [well, volume] of Object.entries(labware.volumeByWell)) {
        const isOverlapping = overlappingWells.some(([ow]) => ow === well)
        if (!isOverlapping) {
          remainingWells[well] = volume
        }
      }
      if (Object.keys(remainingWells).length > 0) {
        if (!cleanedOriginal[liquidId]) cleanedOriginal[liquidId] = []
        cleanedOriginal[liquidId].push({
          labwareId: labware.labwareId,
          volumeByWell: remainingWells,
        })
      }
    }
  }
  return {
    ...cleanedOriginal,
    ...consolidatedWells,
  }
}

export interface LabwareByLiquidId {
  [liquidId: string]: Array<{
    labwareId: string
    volumeByWell: { [well: string]: number }
  }>
}

// Updated getLabwareInfoByLiquidId
export function getLabwareInfoByLiquidId(
  commands: RunTimeCommand[]
): LabwareByLiquidId {
  const loadLiquidCommands =
    commands.length !== 0
      ? commands.filter(
          (command): command is LoadLiquidRunTimeCommand =>
            command.commandType === 'loadLiquid' &&
            command.params.liquidId !== 'EMPTY'
        )
      : []

  const initialLabwareByLiquidId = reduce<
    LoadLiquidRunTimeCommand,
    LabwareByLiquidId
  >(
    loadLiquidCommands,
    (acc, command) => {
      const { liquidId, labwareId, volumeByWell } = command.params
      if (!(liquidId in acc)) acc[liquidId] = []

      const labwareIndex = acc[liquidId].findIndex(
        i => i.labwareId === labwareId
      )
      if (labwareIndex >= 0) {
        acc[liquidId][labwareIndex].volumeByWell = {
          ...acc[liquidId][labwareIndex].volumeByWell,
          ...volumeByWell,
        }
      } else {
        acc[liquidId].push({ labwareId, volumeByWell })
      }
      return acc
    },
    {}
  )
  return consolidateSharedWells(initialLabwareByLiquidId)
}
