// @flow
import assignId from './assignId'
import roundTo from 'round-to'

type Metadata = {
  name: string,
  displayCategory: string,
  displayVolumeUnits?: string,
  displayLengthUnits?: string,
}

type Dimensions = {
  overallLength: number,
  overallWidth: number,
  overallHeight: number,
  offsetX: number,
  offsetY: number,
  offsetZ: number,
}

type Vendor = {
  sku?: string,
  vendor?: string,
}

// 1. Valid pipette type for a container (i.e. is there multi channel access?)
// 2. Is the container a tiprack?
type Params = {
  format: string,
  isTiprack: boolean,
  tipLength?: number,
  wellShape?: string,
}

type Well = {
  depth: number,
  diameter?: number,
  length?: number,
  width?: number,
  totalLiquidVolume?: number,
}

type Schema = {
  otId: number,
  deprecated: boolean,
  metadata: Metadata,
  dimensions: Dimensions,
  parameters: Params,
  vendor?: Vendor,
  ordering: Array<Array<string>>,
  wells: {[wellName: string]: Well},
}

function determineOrdering (grid: Array<number>): Array<Array<string>> {
  var ordering = []
  var rows = grid[0]
  var cols = grid[1]
  var A = 'A'

  var r
  var c

  for (c = 0; c < cols; c++) {
    let colOrdering = []
    for (r = 0; r < rows; r++) {
      var char = String.fromCharCode(A.charCodeAt(0) + r)
      var wellName = char + (1 + c).toString()
      colOrdering.push(wellName)
    }
    ordering.push(colOrdering)
  }

  return ordering
}
// Private helper function to return individual well output
function calculateCoordinates (well: Well, ordering: Array<Array<string>>, spacing: Array<number>): {[wellName: string]: Well} {
  let wells = {}
  var rowSpacing = spacing[0]
  var colSpacing = spacing[1]
  var col
  var row

  for (col = 0; col < ordering.length; col++) {
    var rowLength = ordering[col].length
    for (row = 0; row < rowLength; row++) {
      var x = roundTo(col * colSpacing, 2)
      var y = roundTo((rowLength - row - 1) * rowSpacing, 2)
      var z = 0
      wells[ordering[col][row]] = {...well, x, y, z}
    }
  }

  return wells
}

// Make function public via export function
// Need slot offset
// well spacing
// use display category to do logic checks (tiprack has tip length etc)
// rows/cols
// customization can contain nothing OR ??
export function createRegularLabware (metadata: Metadata, parameters: Params, dimensions: Dimensions, grid: Array<number>, spacing: Array<number>, well: Well, vendor?: Vendor): Schema {
  const otId = assignId()
  const ordering = determineOrdering(grid)
  var definition = null

  const wells = calculateCoordinates(well, ordering, spacing)
  if (vendor) {
    definition = {otId, deprecated: false, metadata, dimensions, parameters, ordering, wells, vendor}
  } else {
    definition = {otId, deprecated: false, metadata, dimensions, parameters, ordering, wells}
  }
  return definition
}
