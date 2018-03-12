const definitions = require('./build/labware.json')

const offset8Channel = 9 // offset in mm
const tipPositions = [0, 1, 2, 3, 4, 5, 6, 7].map(tipNo => (7 - tipNo) * offset8Channel)

/** Find first well at given (x, y) coordinates. Assumes ONLY ONE well at each (x, y) */
function findWellAt (labwareName, x, y) {
  const labware = definitions[labwareName]
  return Object.keys(labware.wells).find(wellName => {
    const well = labware.wells[wellName]
    if (well.diameter) {
      // circular well
      return Math.sqrt(Math.pow(x - well.x, 2) + Math.pow(y - well.y, 2)) <= well.diameter
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
function computeWellAccess (labwareName, topWellName) {
  const labware = definitions[labwareName]
  const topWell = labware.wells[topWellName]
  if (!topWell) {
    // well does not exist in labware
    return null
  }
  const offsetTipPositions = tipPositions.map(origPos => topWell.y - tipPositions[0] + origPos)
  const x = topWell.x

  const wellsAccessed = offsetTipPositions.map(tipPos => findWellAt(labwareName, x, tipPos))

  // TODO: we would use the .every to return null for containers with undefined wells
  // return wellsAccessed
  return wellsAccessed.every(w => w !== undefined) ? wellsAccessed : null
}

// Example
['96-flat', '384-plate', 'trough-12row', 'tube-rack-.75ml', 'trash-box', 'T25-flask', 'fixed-trash'].forEach(testLabware => {
  ['A1', 'A2', 'B1'].forEach(topWell => {
    console.log(testLabware, topWell, computeWellAccess(testLabware, topWell))
  })
})
