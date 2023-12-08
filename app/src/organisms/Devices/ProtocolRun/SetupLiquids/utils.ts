import { WellGroup } from '@opentrons/components'

import type { LabwareByLiquidId } from '@opentrons/components/src/hardware-sim/ProtocolDeck/types'
import type { Liquid } from '@opentrons/shared-data'

export function getWellFillFromLabwareId(
  labwareId: string,
  liquidsInLoadOrder: Liquid[],
  labwareByLiquidId: LabwareByLiquidId
): { [well: string]: string } {
  let labwareWellFill: { [well: string]: string } = {}
  const liquidIds = Object.keys(labwareByLiquidId)
  const labwareInfo = Object.values(labwareByLiquidId)

  labwareInfo.forEach((labwareArray, index) => {
    labwareArray.forEach(labware => {
      if (labware.labwareId === labwareId) {
        const liquidId = liquidIds[index]
        const liquid = liquidsInLoadOrder.find(liquid => liquid.id === liquidId)
        const wellFill: {
          [well: string]: string
        } = {}
        Object.keys(labware.volumeByWell).forEach(key => {
          wellFill[key] = liquid?.displayColor ?? ''
        })
        labwareWellFill = { ...labwareWellFill, ...wellFill }
      }
    })
  })
  return labwareWellFill
}

export function getTotalVolumePerLiquidId(
  liquidId: string,
  labwareByLiquidId: LabwareByLiquidId
): number {
  const labwareInfo = labwareByLiquidId[liquidId]
  const totalVolume = labwareInfo
    .flatMap(labware => Object.values(labware.volumeByWell))
    .reduce((prev, curr) => prev + curr, 0)

  return parseFloat(totalVolume.toFixed(1))
}

export function getTotalVolumePerLiquidLabwarePair(
  liquidId: string,
  labwareId: string,
  labwareByLiquidId: LabwareByLiquidId
): number {
  const labwareInfo = labwareByLiquidId[liquidId]

  const totalVolume = labwareInfo
    .filter(labware => labware.labwareId === labwareId)
    .flatMap(labware => Object.values(labware.volumeByWell))
    .reduce((prev, curr) => prev + curr, 0)

  return totalVolume
}

export function getLiquidsByIdForLabware(
  labwareId: string,
  labwareByLiquidId: LabwareByLiquidId
): LabwareByLiquidId {
  return Object.entries(labwareByLiquidId).reduce(
    (acc, [liquidId, labwareArray]) => {
      const filteredArray = labwareArray.filter(
        labware => labware.labwareId === labwareId
      )
      if (filteredArray.length > 0) {
        return { ...acc, [liquidId]: filteredArray }
      }
      return acc
    },
    {}
  )
}

export function getWellGroupForLiquidId(
  labwareByLiquidId: LabwareByLiquidId,
  liquidId: string
): WellGroup {
  const labwareInfo = labwareByLiquidId[liquidId]
  return labwareInfo.reduce((allWells, { volumeByWell }) => {
    const someWells = Object.entries(volumeByWell).reduce(
      (someWells, [wellName]) => {
        return {
          ...someWells,
          [wellName]: null,
        }
      },
      {}
    )
    return { ...allWells, ...someWells }
  }, {})
}

export function getDisabledWellGroupForLiquidId(
  labwareByLiquidId: LabwareByLiquidId,
  liquidIds: string[]
): WellGroup[] {
  const wellGroups = liquidIds.map(liquidId => {
    const labwareInfo = labwareByLiquidId[liquidId]
    return labwareInfo.reduce((allWells, { volumeByWell }) => {
      const someWells = Object.entries(volumeByWell).reduce(
        (someWells, [wellName]) => {
          return {
            ...someWells,
            [wellName]: null,
          }
        },
        {}
      )
      return { ...allWells, ...someWells }
    }, {})
  })
  return wellGroups
}

export function getWellRangeForLiquidLabwarePair(
  volumeByWell: { [well: string]: number },
  labwareWellOrdering: string[][]
): Array<{
  wellName: string
  volume: number
}> {
  return labwareWellOrdering.reduce(
    (volumePerWellRange: Array<{ wellName: string; volume: number }>, row) => {
      const rangeAndWellsPerRow = row.reduce(
        (rangeAndWells, well, index) => {
          if (index === 0 && volumeByWell[well] != null) {
            rangeAndWells.range = true
            rangeAndWells.wells.push({
              wellName: well,
              volume: volumeByWell[well],
            })
          } else if (
            rangeAndWells.wells.length === index &&
            rangeAndWells.range &&
            volumeByWell[well] != null &&
            volumeByWell[well] === rangeAndWells.wells[index - 1].volume
          ) {
            rangeAndWells.wells.push({
              wellName: well,
              volume: volumeByWell[well],
            })
          } else if (volumeByWell[well] != null) {
            rangeAndWells.range = false
            rangeAndWells.wells.push({
              wellName: well,
              volume: volumeByWell[well],
            })
          } else {
            rangeAndWells.range = false
          }
          return rangeAndWells
        },
        {
          range: false,
          wells: [] as Array<{ wellName: string; volume: number }>,
        }
      )
      if (rangeAndWellsPerRow.range && rangeAndWellsPerRow.wells.length > 1) {
        const rangeString = `${rangeAndWellsPerRow.wells[0].wellName}: ${
          rangeAndWellsPerRow.wells[rangeAndWellsPerRow.wells.length - 1]
            .wellName
        }`
        volumePerWellRange.push({
          wellName: rangeString,
          volume: rangeAndWellsPerRow.wells[0].volume,
        })
      } else {
        volumePerWellRange = volumePerWellRange.concat(
          rangeAndWellsPerRow.wells
        )
      }
      return volumePerWellRange
    },
    []
  )
}
