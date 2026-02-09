import reduce from 'lodash/reduce'

import type { LoadLiquidRunTimeCommand, RunTimeCommand } from '../../command'

export interface LabwareByLiquidId {
  [liquidId: string]: Array<{
    labwareId: string
    volumeByWell: { [well: string]: number }
  }>
}
interface WellVolumeEntry {
  labwareId: string
  volume: number
  liquidId: string
}
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

  const consolidateSharedWells = (
    liquidsByIdForLabware: LabwareByLiquidId
  ): LabwareByLiquidId => {
    const wellToLabwareVolumes: Record<string, WellVolumeEntry[]> = {}

    // Track all wells with their labware, volume, and source liquid
    Object.entries(liquidsByIdForLabware).forEach(
      ([liquidId, labwareArray]) => {
        labwareArray.forEach(labware => {
          Object.entries(labware.volumeByWell).forEach(([well, volume]) => {
            // Only mix liquids in the same labware's well
            const compositeKey = `${labware.labwareId}:${well}`
            wellToLabwareVolumes[compositeKey] ??= []
            wellToLabwareVolumes[compositeKey].push({
              labwareId: labware.labwareId,
              volume,
              liquidId,
            })
          })
        })
      }
    )

    // Identify overlapping wells
    const overlappingWells = Object.entries(wellToLabwareVolumes).filter(
      ([, entries]) => entries.length > 1
    )
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
    // Remove consolidated wells from the original liquids
    const cleanedOriginal: LabwareByLiquidId = {}
    const overlappingWellSet = new Set(
      overlappingWells.map(([compositeKey]) => compositeKey)
    )

    Object.entries(liquidsByIdForLabware).forEach(
      ([liquidId, labwareArray]) => {
        labwareArray.forEach(labware => {
          const remainingWells = Object.fromEntries(
            Object.entries(labware.volumeByWell).filter(
              ([well]) =>
                !overlappingWellSet.has(`${labware.labwareId}:${well}`)
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
      }
    )
    return {
      ...cleanedOriginal,
      ...consolidatedWells,
    }
  }
  return consolidateSharedWells(initialLabwareByLiquidId)
}
