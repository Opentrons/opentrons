// @flow
import range from 'lodash/range'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { getLabwareHasQuirk, sortWells } from '.'

// TODO Ian 2018-03-13 pull pipette offsets/positions from some pipette definitions data
const OFFSET_8_CHANNEL = 9 // offset in mm between tips
const MULTICHANNEL_TIP_SPAN = OFFSET_8_CHANNEL * (8 - 1) // length in mm from first to last tip of multichannel

export function findWellAt(
  labwareDef: LabwareDefinition2,
  x: number,
  y: number
): ?string {
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

// "topWellName" means well at the "top" of the column we're accessing: usually A row, or B row for 384-format
export function getWellNamePerMultiTip(
  labwareDef: LabwareDefinition2,
  topWellName: string
): Array<string> | null {
  const topWell = labwareDef.wells[topWellName]
  if (!topWell) {
    console.warn(
      `well "${topWellName}" does not exist in labware ${labwareDef?.namespace}/${labwareDef?.parameters?.loadName}, cannot getWellNamePerMultiTip`
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
      const wellForTip = findWellAt(labwareDef, x, tipPosY)
      if (acc === null || !wellForTip) {
        return null
      }
      return acc.concat(wellForTip)
    },
    []
  )

  return wellsAccessed
}
