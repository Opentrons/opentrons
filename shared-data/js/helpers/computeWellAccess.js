// @flow
import range from 'lodash/range'
import { getLabware } from '../getLabware'
import { getLabwareHasQuirk } from '.'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

// TODO Ian 2018-03-13 pull pipette offsets/positions from some pipette definitions data
const OFFSET_8_CHANNEL = 9 // offset in mm between tips
const MULTICHANNEL_TIP_SPAN = OFFSET_8_CHANNEL * (8 - 1) // length in mm from first to last tip of multichannel

// TODO: Ian 2019-04-11 DEPRECATED REMOVE
/** Find first well at given (x, y) coordinates. Assumes ONLY ONE well at each (x, y) */
function _findWellAtDeprecated(
  labwareName: string,
  x: number,
  y: number
): ?string {
  const labware = getLabware(labwareName)
  if (!labware) {
    console.warn('Labware ' + labwareName + ' not found.')
    return null
  }
  return Object.keys(labware.wells).find((wellName: string) => {
    const well = labware.wells[wellName]
    const { diameter } = well

    if (typeof diameter === 'number') {
      // circular well
      return (
        Math.sqrt(Math.pow(x - well.x, 2) + Math.pow(y - well.y, 2)) <= diameter
      )
    }

    // Not circular, must be a rectangular well
    // For rectangular wells, (x, y) is at the center.
    // Here we calculate 'wellOriginX/Y', at the bottom left point (lowest x y values)

    // TODO: Ian 2018-09-17 un-comment the below when definitions update to center
    // (right now defs are bottom-left bounding box)

    const wellOriginX = well.x // - (well.width / 2)
    const wellOriginY = well.y // - (well.length / 2)

    return (
      Math.abs(x - wellOriginX) <= well.width &&
      Math.abs(y - wellOriginY) <= well.length
    )
  })
}

function _findWellAt(
  labwareDef: LabwareDefinition2,
  x: number,
  y: number
): ?string {
  return Object.keys(labwareDef.wells).find((wellName: string) => {
    const well = labwareDef.wells[wellName]

    if (well.shape === 'circular') {
      return (
        Math.sqrt(Math.pow(x - well.x, 2) + Math.pow(y - well.y, 2)) <=
        well.diameter
      )
    }

    // Not circular, must be a rectangular well
    // For rectangular wells, (x, y) is at the center.
    return (
      Math.abs(x - well.x) <= well.xDimension &&
      Math.abs(y - well.y) <= well.yDimension
    )
  })
}

// TODO: Ian 2019-04-11 DEPRECATED REMOVE
// "topWell" means well at the "top" of the column we're accessing: usually A row, or B row for 384-format
export function computeWellAccessDeprecated(
  labwareName: string,
  topWellName: string
): Array<string> | null {
  const labware = getLabware(labwareName)
  if (!labware) {
    return null
  }

  const topWell = labware.wells[topWellName]
  if (!topWell) {
    // well does not exist in labware
    return null
  }

  const tipPositions = [0, 1, 2, 3, 4, 5, 6, 7].map(
    tipNo => (7 - tipNo) * OFFSET_8_CHANNEL
  )

  const x = topWell.x
  const offsetTipPositions = tipPositions.map(
    origPos => topWell.y - tipPositions[0] + origPos
  )

  // Return null for containers with any undefined wells
  const wellsAccessed = offsetTipPositions.reduce(
    (acc: Array<string> | null, tipPos) => {
      const wellForTip = _findWellAtDeprecated(labwareName, x, tipPos)
      if (acc === null || !wellForTip) {
        return null
      }
      return acc.concat(wellForTip)
    },
    []
  )

  return wellsAccessed
}

// "topWellName" means well at the "top" of the column we're accessing: usually A row, or B row for 384-format
export function computeWellAccess(
  labwareDef: LabwareDefinition2,
  topWellName: string
): Array<string> | null {
  const topWell = labwareDef.wells[topWellName]
  if (!topWell) {
    console.warn(
      `well "${topWellName}" does not exist in labware "${
        labwareDef.otId
      }", cannot computeWellAccess`
    )
    return null
  }

  const { x, y } = topWell
  let offsetYTipPositions: Array<number> = range(0, 8).map(
    tipNo => y - tipNo * OFFSET_8_CHANNEL
  )

  if (getLabwareHasQuirk(labwareDef, 'centerMultichannelOnWells')) {
    // move multichannel up in Y by half the pipette's tip span to center it in the well
    offsetYTipPositions = offsetYTipPositions.map(
      tipPosY => tipPosY + MULTICHANNEL_TIP_SPAN / 2
    )
  }

  // Return null for containers with any undefined wells
  const wellsAccessed = offsetYTipPositions.reduce(
    (acc: Array<string> | null, tipPosY) => {
      const wellForTip = _findWellAt(labwareDef, x, tipPosY)
      if (acc === null || !wellForTip) {
        return null
      }
      return acc.concat(wellForTip)
    },
    []
  )

  return wellsAccessed
}
