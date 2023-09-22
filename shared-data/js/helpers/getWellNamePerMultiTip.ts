import range from 'lodash/range'
import { getLabwareHasQuirk, orderWells, sortWells } from './index'
import type { LabwareDefinition2 } from '../types'

// TODO Ian 2018-03-13 pull pipette offsets/positions from some pipette definitions data
const OFFSET_8_CHANNEL = 9 // offset in mm between tips

const MULTICHANNEL_TIP_SPAN = OFFSET_8_CHANNEL * (8 - 1) // length in mm from first to last tip of multichannel

export function findWellAt(
  labwareDef: LabwareDefinition2,
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

// "topWellName" means well at the "top" of the column we're accessing: usually A row, or B row for 384-format
export function getWellNamePerMultiTip(
  labwareDef: LabwareDefinition2,
  topWellName: string,
  channels: 8 | 96
): string[] | null {
  const topWell = labwareDef.wells[topWellName]

  if (!topWell) {
    console.warn(
      `well "${topWellName}" does not exist in labware ${labwareDef?.namespace}/${labwareDef?.parameters?.loadName}, cannot getWellNamePerMultiTip`
    )
    return null
  }

  const { x, y } = topWell
  let offsetYTipPositions: number[] = range(0, channels).map(
    tipNo => y - tipNo * OFFSET_8_CHANNEL
  )
  const orderedWells = orderWells(labwareDef.ordering, 't2b', 'l2r')

  if (getLabwareHasQuirk(labwareDef, 'centerMultichannelOnWells')) {
    // move multichannel up in Y by half the pipette's tip span to center it in the well
    offsetYTipPositions = offsetYTipPositions.map(
      tipPosY => tipPosY + MULTICHANNEL_TIP_SPAN / 2
    )
  }
  console.log('offsetYTipPositions', offsetYTipPositions)
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
  console.log(' wellsAccessed', wellsAccessed)
  // let ninetySixChannelWells = orderedWells
  //  special casing 384 well plates since its the only labware
  //  where the full 96-channel tip rack can't aspirate from
  //  every well
  // if (orderedWells.length === 384) {
  //   const selectedWells: string[] = []

  //   const maxX = 12 // Number of wells in the X-axis
  //   const maxY = 8 // Number of wells in the Y-axis
  //   const maxCount = maxX * maxY

  //   // Split the starting well into row and column parts
  //   const startingRow = topWellName.charAt(0)
  //   const startingCol = parseInt(topWellName.substring(1), 10)

  //   let currentRow = startingRow
  //   let currentCol = startingCol

  //   for (let y = 0; y < maxY; y++) {
  //     for (let x = 0; x < maxX; x++) {
  //       // Ensure the currentRow and currentCol are within the bounds of your array
  //       if (currentRow.charCodeAt(0) <= 'P'.charCodeAt(0) && currentCol <= 24) {
  //         // Get the current well
  //         const well = currentRow + currentCol.toString()
  //         selectedWells.push(well)

  //         // Move to the next well in the X-axis
  //         currentCol += 2
  //       }
  //     }

  //     // Move to the next row in the Y-axis and reset the X-axis
  //     currentRow = String.fromCharCode(currentRow.charCodeAt(0) + 1)
  //     currentCol = startingCol
  //   }

  //   ninetySixChannelWells = selectedWells
  // }

  // console.log('wellsAccessed', wellsAccessed)
  // console.log('orderedWells', orderedWells)
  return channels === 8 ? wellsAccessed : orderedWells
}
