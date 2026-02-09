import reduce from 'lodash/reduce'

import type { LoadLiquidRunTimeCommand, RunTimeCommand } from '../../command'

export interface LabwareByLiquidId {
  [liquidId: string]: LabwareVolumeEntry[]
}

interface WellVolumeMap {
  [well: string]: number
}

interface LabwareVolumeEntry {
  labwareId: string
  volumeByWell: WellVolumeMap
}

interface WellVolumeEntry {
  labwareId: string
  volume: number
  liquidId: string
}

// Filter for loadLiquid commands with non-empty liquids, then build and consolidate them
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

  const initialLabwareByLiquidId =
    buildInitialLabwareByLiquidId(loadLiquidCommands)

  return consolidateSharedWells(initialLabwareByLiquidId)
}

// Group labware by liquidId, merging volumeByWell entries when the same labware
// appears multiple times for the same liquid
function buildInitialLabwareByLiquidId(
  commands: LoadLiquidRunTimeCommand[]
): LabwareByLiquidId {
  return reduce<LoadLiquidRunTimeCommand, LabwareByLiquidId>(
    commands,
    (acc, command) => {
      const { liquidId, labwareId, volumeByWell } = command.params
      if (!(liquidId in acc)) acc[liquidId] = []

      const labwareIndex = acc[liquidId].findIndex(
        i => i.labwareId === labwareId
      )

      if (labwareIndex >= 0) {
        // Merge wells into existing labware entry
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
}

// Build a reverse mapping of wells to all liquids that occupy them
function consolidateSharedWells(
  liquidsByIdForLabware: LabwareByLiquidId
): LabwareByLiquidId {
  const wellToLabwareVolumes: Record<string, WellVolumeEntry[]> = {}

  Object.entries(liquidsByIdForLabware).forEach(([liquidId, labwareArray]) => {
    labwareArray.forEach(labware => {
      Object.entries(labware.volumeByWell).forEach(([well, volume]) => {
        const compositeKey = `${labware.labwareId}:${well}`
        wellToLabwareVolumes[compositeKey] ??= []
        wellToLabwareVolumes[compositeKey].push({
          labwareId: labware.labwareId,
          volume,
          liquidId,
        })
      })
    })
  })

  // Find wells that have been loaded with multiple different liquids
  const overlappingWells = Object.entries(wellToLabwareVolumes).filter(
    ([, entries]) => entries.length > 1
  )

  // Create consolidated entries for wells with mixed liquids
  const consolidatedWells: LabwareByLiquidId = {}

  overlappingWells.forEach(([compositeKey, entries]) => {
    const totalVolume = entries.reduce((sum, entry) => sum + entry.volume, 0)
    const labwareIdName = entries[0].labwareId
    const liquidIds = entries.map(e => e.liquidId).sort()
    const mixedLiquidId = `mixed-${liquidIds.join('-')}`

    consolidatedWells[mixedLiquidId] ??= [
      { labwareId: labwareIdName, volumeByWell: {} },
    ]
    const wellName = compositeKey.split(':')[1]
    consolidatedWells[mixedLiquidId][0].volumeByWell[wellName] = totalVolume
  })

  // Remove overlapping wells from original liquid entries, keeping only non-overlapping wells
  const cleanedOriginal: LabwareByLiquidId = {}
  const overlappingWellSet = new Set(
    overlappingWells.map(([compositeKey]) => compositeKey)
  )

  Object.entries(liquidsByIdForLabware).forEach(([liquidId, labwareArray]) => {
    labwareArray.forEach(labware => {
      const remainingWells = Object.fromEntries(
        Object.entries(labware.volumeByWell).filter(
          ([well]) => !overlappingWellSet.has(`${labware.labwareId}:${well}`)
        )
      )

      if (Object.keys(remainingWells).length > 0) {
        cleanedOriginal[liquidId] ??= []
        cleanedOriginal[liquidId].push({
          labwareId: labware.labwareId,
          volumeByWell: remainingWells,
        })
      }
    })
  })

  return {
    ...cleanedOriginal,
    ...consolidatedWells,
  }
}
