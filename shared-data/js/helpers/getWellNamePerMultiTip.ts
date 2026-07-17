import range from 'lodash/range'

import { get96Channel384WellPlateWells } from './get96Channel384WellPlateWells'
import { getLabwareHasQuirk, orderWells, sortWells } from './index'

import type { ActiveNozzleNumber, LabwareDefinition } from '../types'

// TODO Ian 2018-03-13 pull pipette offsets/positions from some pipette definitions data
const OFFSET_8_CHANNEL = 9 // offset in mm between tips

const COLUMN_TIP_COUNT = 8
const ROW_TIP_COUNT = 12

const MULTICHANNEL_COLUMN_TIP_SPAN = OFFSET_8_CHANNEL * (COLUMN_TIP_COUNT - 1)
const MULTICHANNEL_ROW_TIP_SPAN = OFFSET_8_CHANNEL * (ROW_TIP_COUNT - 1)

/** returns true when labware is a series of row-length wells (ex: 8-well reservoir). */
export function isRowLabware(labwareDef: LabwareDefinition): boolean {
  return (
    Object.keys(labwareDef.wells).length > 1 && labwareDef.ordering.length === 1
  )
}

/** returns true when labware is a series of column-length wells (ex: 12-well reservoir). */
export function isColumnLabware(labwareDef: LabwareDefinition): boolean {
  return (
    Object.keys(labwareDef.wells).length > 1 &&
    labwareDef.ordering.every(column => column.length === 1)
  )
}

function shouldCenterRowTipsOnWell(labwareDef: LabwareDefinition): boolean {
  if (!getLabwareHasQuirk(labwareDef, 'centerMultichannelOnWells')) {
    return false
  }
  const wellCount = Object.keys(labwareDef.wells).length
  // single-well reservoirs and row troughs: center the row of tips in X
  // column troughs keep SBS X spacing so each tip lands in its own trough
  return wellCount === 1 || isRowLabware(labwareDef)
}

export function findWellAt(
  labwareDef: LabwareDefinition,
  x: number,
  y: number
): string | null | undefined {
  return Object.keys(labwareDef.wells)
    .sort(sortWells)
    .find((wellName: string) => {
      const well = labwareDef.wells[wellName]

      if (well.shape === 'circular') {
        return (
          Math.sqrt(Math.pow(x - well.x, 2) + Math.pow(y - well.y, 2)) <
          well.diameter / 2
        )
      }

      // Not circular, must be a rectangular well
      // For rectangular wells, (x, y) is at the center.
      return (
        Math.abs(x - well.x) < well.xDimension / 2 &&
        Math.abs(y - well.y) < well.yDimension / 2
      )
    })
}

/**
 * Given a well, return the wells contacted by a 12-tip row (9 mm pitch -- see const above),
 * or null if any tip misses a well.
 *
 * With centerMultichannelOnWells on row troughs / 1-well reservoirs, the tip
 * span is centered on the well in X so all tips share one wide trough.
 */
export function getWellNamePerRowMultiTip(
  labwareDef: LabwareDefinition,
  wellName: string
): string[] | null {
  const well = labwareDef.wells[wellName]
  if (!well) {
    console.warn(
      `well "${wellName}" does not exist in labware ${labwareDef?.namespace}/${labwareDef?.parameters?.loadName}, cannot getWellNamePerRowMultiTip`
    )
    return null
  }

  const { x, y } = well
  let offsetXTipPositions: number[] = range(0, ROW_TIP_COUNT).map(
    tipNo => x + tipNo * OFFSET_8_CHANNEL
  )

  if (shouldCenterRowTipsOnWell(labwareDef)) {
    offsetXTipPositions = offsetXTipPositions.map(
      tipPosX => tipPosX - MULTICHANNEL_ROW_TIP_SPAN / 2
    )
  }

  return offsetXTipPositions.reduce((acc: string[] | null, tipPosX) => {
    const wellForTip = findWellAt(labwareDef, tipPosX, y)
    if (acc === null || !wellForTip) {
      return null
    }
    return acc.concat(wellForTip)
  }, [])
}

// "topWellName" means well at the "top" of the column we're accessing: usually A row, or B row for 384-format
export function getWellNamePerMultiTip(
  labwareDef: LabwareDefinition,
  topWellName: string,
  channels: ActiveNozzleNumber
): string[] | null {
  const topWell = labwareDef.wells[topWellName]
  const wellOrdering = labwareDef.ordering
  const orderedWells = orderWells(labwareDef.ordering, 't2b', 'l2r')

  if (!topWell) {
    console.warn(
      `well "${topWellName}" does not exist in labware ${labwareDef?.namespace}/${labwareDef?.parameters?.loadName}, cannot getWellNamePerMultiTip`
    )
    return null
  }
  const is384Plate = orderedWells.length === 384
  if (channels !== 8 && channels !== 1 && channels !== 96 && channels !== 12) {
    const indexOfTopWell = orderedWells.indexOf(topWellName)
    const test = orderedWells.slice(indexOfTopWell, indexOfTopWell + channels)
    if (is384Plate) {
      return skipEveryOtherWell(
        topWellName,
        orderedWells.slice(indexOfTopWell, indexOfTopWell + channels * 2)
      )
    }
    return test
  }
  const { x, y } = topWell
  let offsetYTipPositions: number[] = range(0, COLUMN_TIP_COUNT).map(
    tipNo => y - tipNo * OFFSET_8_CHANNEL
  )

  if (getLabwareHasQuirk(labwareDef, 'centerMultichannelOnWells')) {
    // move multichannel up in Y by half the pipette's tip span to center it in the well
    offsetYTipPositions = offsetYTipPositions.map(
      tipPosY => tipPosY + MULTICHANNEL_COLUMN_TIP_SPAN / 2
    )
  }
  // Return null for containers with any undefined wells
  const wellsAccessed = offsetYTipPositions.reduce(
    (acc: string[] | null, tipPosY) => {
      const wellForTip = findWellAt(labwareDef, x, tipPosY)
      if (acc === null || !wellForTip) {
        return null
      }
      return acc.concat(wellForTip)
    },
    []
  )

  let ninetySixChannelWells = orderedWells
  //  special casing 384 well plates to be every other well
  //  both on the x and y ases.
  if (is384Plate) {
    ninetySixChannelWells = get96Channel384WellPlateWells(
      orderedWells,
      topWellName
    )
  }
  // get row
  if (channels === 12) {
    const columnIndex = wellOrdering.findIndex(column => {
      return column.includes(topWellName)
    })
    const rowIndex = wellOrdering[columnIndex].indexOf(topWellName)
    if (!is384Plate) {
      return wellOrdering.map(column => column[rowIndex])
    } else {
      return skipEveryOtherWell(
        topWellName,
        wellOrdering.map(column => column[rowIndex])
      )
    }
  }

  return channels === 8 ? wellsAccessed : ninetySixChannelWells
}

export const skipEveryOtherWell = (
  hoveredWell: string,
  wells: string[]
): string[] => {
  const startIndex = wells.indexOf(hoveredWell)
  const firstWell = startIndex % 2 === 0 ? 0 : 1
  const filteredWells = wells.filter(
    (_, index) => index >= firstWell && (index - firstWell) % 2 === 0
  )
  return filteredWells
}
