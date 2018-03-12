// @flow
import type {LabwareDefinition} from './types'
import getLabware from './getLabware'

const offset8Channel = 9 // offset in mm
const tipPositions = [0, 1, 2, 3, 4, 5, 6, 7].map(tipNo => (7 - tipNo) * offset8Channel)

/** Find first well at given (x, y) coordinates. Assumes ONLY ONE well at each (x, y) */
function findWellAt (labwareName: string, x: number, y: number): ?string {
  const labware: {wells: $PropertyType<LabwareDefinition, 'wells'>} = getLabware(labwareName)
  return Object.keys(labware.wells).find((wellName: string) => {
    const well = labware.wells[wellName]
    const {diameter} = well
    if (typeof diameter === 'number') {
      // circular well
      return Math.sqrt(Math.pow(x - well.x, 2) + Math.pow(y - well.y, 2)) <= diameter
    } else if (well.width && well.length) {
      // rectangular well
      // For rectangular wells, (x, y) is at the center.
      // Here we calculate 'wellOriginX/Y', at the bottom left point (lowest x y values)
      const wellOriginX = well.x - (well.width / 2)
      const wellOriginY = well.y - (well.length / 2)
      return Math.abs(x - wellOriginX) <= well.width &&
        Math.abs(y - wellOriginY) <= well.length
    }
    throw new Error(`Well ${wellName} of labware ${labwareName} has no diameter, and is missing width and/or length`)
  })
}

// "topWell" means well at the "top" of the column we're accessing: usually A row, or B row for 384-format
export default function computeWellAccess (labwareName: string, topWellName: string): Array<string> | null {
  const labware = getLabware(labwareName)
  const topWell = labware.wells[topWellName]
  if (!topWell) {
    // well does not exist in labware
    return null
  }
  const offsetTipPositions = tipPositions.map(origPos => topWell.y - tipPositions[0] + origPos)
  const x = topWell.x

  // Return null for containers with any undefined wells
  const wellsAccessed = offsetTipPositions.reduce((acc: Array<string> | null, tipPos) => {
    const wellForTip = findWellAt(labwareName, x, tipPos)
    if (acc === null || !wellForTip) {
      return null
    }
    return acc.concat(wellForTip)
  }, [])

  return wellsAccessed
}
