// @flow
import Ajv from 'ajv'
import range from 'lodash/range'

import assignId from './assignId'
import {toWellName, sortWells, splitWellsOnColumn} from '../helpers/index'
import labwareSchema from '../../labware-json-schema/labware-schema.json'
import {
  SLOT_WIDTH_MM as SLOT_LENGTH_MM,
  SLOT_HEIGHT_MM as SLOT_WIDTH_MM,
} from '../constants'

type Metadata = {
  displayName: string,
  displayCategory: string,
  displayVolumeUnits: string,
  displayLengthUnits?: string,
  tags?: Array<string>,
}

type Dimensions = {
  overallLength: number,
  overallWidth: number,
  overallHeight: number,
}

type Brand = {
  brandId?: Array<string>,
  brand: string,
}

// 1. Valid pipette type for a container (i.e. is there multi channel access?)
// 2. Is the container a tiprack?
type Params = {
  format: string,
  isTiprack: boolean,
  tipLength?: number,
  loadName?: string,
}

type Well = {
  depth: number,
  shape: string,
  diameter?: number,
  length?: number,
  width?: number,
  totalLiquidVolume: number,
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

// This represents creating a "range" of well names with step intervals included
// For example, starting at well "A1" with a column stride of 2 would result in
// the grid name being ordered as: "A1", "B1"..."A3", "B3"..etc
type GridStart = {
  rowStart: string,
  colStart: string,
  rowStride: number,
  colStride: number,
}

export type RegularLabwareProps = {
  metadata: Metadata,
  parameters: Params,
  offset: Offset,
  dimensions: Dimensions,
  grid: Cell,
  spacing: Cell,
  well: Well,
  brand: Brand,
}

export type IrregularLabwareProps = {
  metadata: Metadata,
  parameters: Params,
  offset: Array<Offset>,
  dimensions: Dimensions,
  grid: Array<Cell>,
  spacing: Array<Cell>,
  well: Array<Well>,
  brand: Brand,
  gridStart: Array<GridStart>,
}

export type Schema = {
  otId: string,
  deprecated: boolean,
  metadata: Metadata,
  dimensions: Dimensions,
  cornerOffsetFromSlot: Offset,
  parameters: Params,
  brand?: Brand,
  ordering: Array<Array<string>>,
  wells: {[wellName: string]: Well},
}

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})
const validate = ajv.compile(labwareSchema)

function round (value, decimals) {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals)
}

export function determineLayout (
  grids: Array<Cell>,
  spacing: Array<Cell>,
  offset: Array<Offset>,
  gridStart: Array<GridStart>,
  wells: Array<Well>): {[wellName: string]: Well} {
  let wellList = {}
  grids.forEach((gridObj, gridIdx) => {
    range(gridObj.column).map(colIdx => {
      range(gridObj.row).map(rowIdx => {
        const rowNum = rowIdx * gridStart[gridIdx].rowStride + gridStart[gridIdx].rowStart.charCodeAt(0) - 65
        const colNum = colIdx * gridStart[gridIdx].colStride + parseInt(gridStart[gridIdx].colStart) - 1
        const wellName = toWellName({rowNum, colNum})
        wellList[wellName] = {
          ...wells[gridIdx],
          x: round(colIdx * spacing[gridIdx].column + offset[gridIdx].x, 2),
          y: round(rowIdx * spacing[gridIdx].row + offset[gridIdx].y, 2),
          z: round(offset[gridIdx].z - wells[gridIdx].depth, 2)}
      })
    })
  })
  return wellList
}
// Decide order of wells for single grid containers
function determineOrdering (grid: Cell): Array<Array<string>> {
  const ordering = range(grid.column).map(colNum =>
    range(grid.row).map(rowNum =>
      toWellName({rowNum, colNum})))

  return ordering
}

// Decide order of wells for multi-grid containers
export function determineIrregularOrdering (wellsArray: Array<string>): Array<Array<string>> {
  const sortedArray = wellsArray.sort(sortWells)
  const ordering = splitWellsOnColumn(sortedArray)

  return ordering
}
// Private helper functione to calculate the XYZ coordinates of a give well
// Will return a nested object of all well objects for a labware
function calculateCoordinates (
  well: Well,
  ordering: Array<Array<string>>,
  spacing: Cell,
  offset: Offset): {[wellName: string]: Well} {
  // Note, reverse() on its own mutates ordering. Use slice() as a workaround
  // to prevent mutation
  return ordering.reduce((wells, column, cIndex) => {
    column.slice().reverse().forEach((element, rIndex) => {
      wells[element] = {
        ...well,
        x: round(cIndex * spacing.column + offset.x, 2),
        y: round(rIndex * spacing.row + offset.y, 2),
        z: round(offset.z - well.depth, 2)}
    })
    return wells
  }, {})
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
// brand: Brand
// For further info on these parameters look at labware examples in __tests__
// or the labware definition schema in labware-json-schema
export function createRegularLabware (props: RegularLabwareProps): Schema {
  const ordering = determineOrdering(props.grid)
  const offset = {...props.offset, z: round(props.dimensions.overallHeight + props.offset.z, 2)}
  const definition: Schema = {
    ordering,
    otId: assignId(),
    deprecated: false,
    metadata: props.metadata,
    cornerOffsetFromSlot: {
      x: round(props.dimensions.overallLength - SLOT_LENGTH_MM, 2),
      y: round(props.dimensions.overallWidth - SLOT_WIDTH_MM, 2),
      z: 0},
    dimensions: props.dimensions,
    parameters: props.parameters,
    wells: calculateCoordinates(props.well, ordering, props.spacing, offset),
  }
  const numWells = props.grid.row * props.grid.column
  const brand = (props.brand && props.brand.brand) || 'generic'
  if (props.brand) definition.brand = props.brand

  definition.parameters.loadName = `${brand}_${numWells}_${
    props.metadata.displayCategory}_${props.well.totalLiquidVolume}_${
    props.metadata.displayVolumeUnits}`

  const valid = validate(definition)
  if (valid !== true) {
    throw new Error('1 or more required arguments missing from input.')
  }
  return definition
}

// Generator function for labware definitions within an irregular grid format
// e.g. crystalization plates, 15_50ml tuberacks and anything with multiple "grids"
// Required parameters are:
//  metadata: Metadata,
//  parameters: Params,
//  dimensions: Dimensions,
//  grid: Array<Cell>,
//  spacing: Array<Cell>,
//  well: Array<Well>,
//  gridStart: Array<gridStart>
// Optional parameters are:
// brand: Brand
// For further info on these parameters look at labware examples in __tests__
// or the labware definition schema in labware-json-schema
export function createIrregularLabware (props: IrregularLabwareProps): Schema {
  let offset = []
  props.offset.forEach(offsetObj => {
    offset.push({
      ...offsetObj,
      z: round(props.dimensions.overallHeight + offsetObj.z, 2),
    })
  })
  const wellsArray = determineLayout(props.grid, props.spacing, offset, props.gridStart, props.well)
  const ordering = determineIrregularOrdering(Object.keys(wellsArray))
  const definition: Schema = {
    ordering,
    otId: assignId(),
    deprecated: false,
    metadata: props.metadata,
    cornerOffsetFromSlot: {
      x: round(props.dimensions.overallLength - SLOT_LENGTH_MM, 2),
      y: round(props.dimensions.overallWidth - SLOT_WIDTH_MM, 2),
      z: 0},
    dimensions: props.dimensions,
    parameters: {...props.parameters, format: 'irregular'},
    wells: wellsArray,
    }

    const brand = (props.brand && props.brand.brand) || 'generic'
    if (props.brand) definition.brand = props.brand

    // generate loadName based on numwells per grid type
    let loadName = ''
    props.grid.forEach((gridObj, gridIdx) => {
      const numWells = gridObj.row * gridObj.column
      loadName += `${numWells}x${props.well[gridIdx].totalLiquidVolume}_${
        props.metadata.displayVolumeUnits}`
    })
    definition.parameters.loadName = `${brand}_${loadName}_${props.metadata.displayCategory}`

    const valid = validate(definition)
    if (valid !== true) {
      throw new Error('1 or more required arguments missing from input.')
    }
    return definition
}
