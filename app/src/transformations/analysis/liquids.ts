import { COLORS } from '@opentrons/components'

import type { WellGroup } from '@opentrons/components'
import type { LabwareByLiquidId, Liquid } from '@opentrons/shared-data'

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
          wellFill[key] = liquid?.displayColor ?? COLORS.transparent
        })
        labwareWellFill = { ...labwareWellFill, ...wellFill }
      }
    })
  })
  return labwareWellFill
}

export function getDisabledWellFillFromLabwareId(
  labwareId: string,
  liquidsInLoadOrder: Liquid[],
  labwareByLiquidId: LabwareByLiquidId,
  selectedLabwareId?: string
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
          if (liquidId === selectedLabwareId) {
            wellFill[key] = liquid?.displayColor ?? COLORS.transparent
            // apply 40% opacity to disabled wells if well not already filled
          } else if (wellFill[key] == null && labwareWellFill[key] == null) {
            wellFill[key] =
              `${liquid?.displayColor}${COLORS.opacity40HexCode}` ??
              COLORS.transparent
          }
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

export function getVolumePerWell(
  liquidId: string,
  labwareId: string,
  labwareByLiquidId: LabwareByLiquidId
): number | null {
  const labwareInfo = labwareByLiquidId[liquidId]
  const volumes = labwareInfo
    .filter(labware => labware.labwareId === labwareId)
    .flatMap(labware => Object.values(labware.volumeByWell))
  if (new Set(volumes).size === 1) {
    return parseFloat(volumes[0].toFixed(1))
  } else {
    return null
  }
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
