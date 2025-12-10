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

  // Map from well name -> all labware/volume/liquid entries that occupy that well
  const wellToLabwareVolumes: Record<string, WellVolumeEntry[]> = {}

  // Step 1: Track all wells with their labware, volume, and source liquid
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

  // Step 2: Identify overlapping wells
  const overlappingWells = Object.entries(wellToLabwareVolumes)
    .filter(([, entries]) => entries.length > 1)
    .map(([well]) => well)

  if (overlappingWells.length === 0) return liquidsByIdForLabware

  // Step 3: Remove overlapping wells from original liquids
  const cleanedLiquids: LabwareByLiquidId = {}
  for (const [liquidId, labwareArray] of Object.entries(
    liquidsByIdForLabware
  )) {
    cleanedLiquids[liquidId] = labwareArray.map(labware => {
      const newVolumeByWell = Object.fromEntries(
        Object.entries(labware.volumeByWell).filter(
          ([well]) => !overlappingWells.includes(well)
        )
      )
      return { ...labware, volumeByWell: newVolumeByWell }
    })
  }

  // Step 4: Build mixedLiquids per overlapping well
  const mixedLiquids: LabwareByLiquidId = {}

  overlappingWells.forEach(well => {
    const entries = wellToLabwareVolumes[well]
    const labwareId = entries[0].labwareId // assume all entries are same labware?

    // Collect contributing liquid names
    const description = entries.map(e => e.liquidId).join(', ')

    const mixedId = `mixed-${labwareId}-${well}`

    mixedLiquids[mixedId] = [
      {
        labwareId,
        volumeByWell: { [well]: entries.reduce((sum, e) => sum + e.volume, 0) },
      },
    ]
  })

  return {
    ...cleanedLiquids,
    ...mixedLiquids,
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
