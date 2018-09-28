// @flow
import range from 'lodash/range'

import assignId from './assignId'
import {toWellName} from '../helpers/index'

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
  shape: string,
  diameter?: number,
  length?: number,
  width?: number,
  totalLiquidVolume?: number,
}

type Cell = {
  row: number,
  column: number,
}

type Offset = {
  x: number,
  y: number,
  z: number,
}

export type RegularLabwareProps = {
  metadata: Metadata,
  parameters: Params,
  offset: Offset,
  dimensions: Dimensions,
  grid: Cell,
  spacing: Cell,
  well: Well,
  vendor?: Vendor,
}

type Schema = {
  otId: string,
  deprecated: boolean,
  metadata: Metadata,
  dimensions: Dimensions,
  parameters: Params,
  vendor?: Vendor,
  ordering: Array<Array<string>>,
  wells: {[wellName: string]: Well},
}

function round (value, decimals) {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals)
}

function determineOrdering (grid: Cell): Array<Array<string>> {
  const ordering = range(grid.column).map(colNum =>
    range(grid.row).map(rowNum =>
      toWellName({rowNum, colNum})))

  return ordering
}
// Private helper function to calculate the XYZ coordinates of a give well
// Will return a nested object of all well objects for a labware
function calculateCoordinates (
  well: Well,
  ordering: Array<Array<string>>,
  spacing: Cell): {[wellName: string]: Well} {
  let wells = {}

  // Note, reverse() on its own mutates ordering. Use slice() as a workaround
  // to prevent mutation
  ordering.forEach(function (subarray, cIndex) {
    subarray.slice().reverse().forEach(function (element, rIndex) {
      wells[element] = {
        ...well,
        x: round(cIndex * spacing.column, 2),
        y: round(rIndex * spacing.row, 2),
        z: 0}
    })
  })

  return wells
}

// Generator function for labware definitions within a regular grid format
// e.g. well plates, regular tuberacks (NOT 15_50ml) etc.
// Required parameters are:
//   metadata: Metadata,
//  parameters: Params,
//  dimensions: Dimensions,
//  grid: Cell,
//  spacing: Cell,
//  well: Well,
// Optional parameters are:
// vendor: Vendor
// For further info on these parameters look at labware examples in __tests__
// or the labware definition schema in labware-json-schema
export function createRegularLabware (props: RegularLabwareProps): Schema {
  const ordering = determineOrdering(props.grid)
  const definition: Schema = {
    ordering,
    otId: assignId(),
    deprecated: false,
    metadata: props.metadata,
    cornerOffsetFromSlot: props.offset,
    dimensions: props.dimensions,
    parameters: props.parameters,
    wells: calculateCoordinates(props.well, ordering, props.spacing),
  }

  if (props.vendor) definition.vendor = props.vendor

  return definition
}
