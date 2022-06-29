import { getLabwareDisplayName, RunTimeCommand } from '@opentrons/shared-data'
import type { LabwareByLiquidId, Liquid } from '@opentrons/api-client'
import { WellGroup } from '@opentrons/components'

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
        const liquid = liquidsInLoadOrder.find(
          liquid => liquid.liquidId === liquidId
        )
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

  return totalVolume
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

export function getSlotLabwareName(
  labwareId: string,
  commands?: RunTimeCommand[]
): { slotName: string; labwareName: string } {
  const loadLabwareCommands = commands?.filter(
    command => command.commandType === 'loadLabware'
  )
  const loadLabwareCommand = loadLabwareCommands?.find(
    command => command.result.labwareId === labwareId
  )
  if (loadLabwareCommand == null) {
    return { slotName: '', labwareName: labwareId }
  }
  const labwareName = getLabwareDisplayName(
    loadLabwareCommand.result.definition
  )
  let slotName = ''
  const labwareLocation =
    'location' in loadLabwareCommand.params
      ? loadLabwareCommand.params.location
      : ''
  if ('slotName' in labwareLocation) {
    slotName = labwareLocation.slotName
  } else {
    const loadModuleCommands = commands?.filter(
      command => command.commandType === 'loadModule'
    )
    const loadModuleCommand = loadModuleCommands?.find(
      command => command.result.moduleId === labwareLocation.moduleId
    )
    slotName =
      loadModuleCommand != null && 'location' in loadModuleCommand.params
        ? loadModuleCommand?.params.location.slotName
        : ''
  }

  return {
    slotName,
    labwareName,
  }
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

// labware ordering
// liquids by id for labware
// start at top [0][0]
// check if this is in volumeByWell
// if yes, store volume and check [0][1]
// if yes through [0][end], store index [0] and the volume
// if no, check [1][0]
// once you reach the end, look see if adjacent indeces have same volume
// then range them based on [0][0] to [last][last]

export function getWellRangeForLiquidLabwarePair(): any {
  const volumeByWell = {
    A3: 100,
    A4: 100,
    B3: 100,
    B4: 100,
    C3: 100,
    C4: 100,
    D3: 100,
    D4: 100,
  }
  const ordering = [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
    ['A4', 'B4', 'C4', 'D4'],
    ['A5', 'B5', 'C5', 'D5'],
    ['A6', 'B6', 'C6', 'D6'],
  ]

  const myArray = ordering.reduce((totalAcc, row, index) => {
    const rowValues = row.reduce((rowAcc, well, index) => {
      if (index === 0 && volumeByWell[well] != null) {
        return [{ wellName: well, volume: volumeByWell[well] }]
      } else if (
        rowAcc[0] != null &&
        volumeByWell[well] != null &&
        volumeByWell[well] === rowAcc[0].volume
      ) {
        return [rowAcc[0], { wellName: well, volume: volumeByWell[well] }]
      } else {
        return []
      }
    }, [])
    // in outer reduce -- if no rowValues, add every volume by well for that row
    // or if rowValues is greater than 2 ??
    if (rowValues.length === 2) {
      const rangeString = `${rowValues[0].wellName}: ${rowValues[1].wellName}`
      totalAcc.push({ range: rangeString, volume: rowValues[0].volume })
    }
    return totalAcc
  }, [])

  console.log(myArray)
}
