// @flow
import Ajv from 'ajv'
import flatten from 'lodash/flatten'
import range from 'lodash/range'
import round from 'lodash/round'

import labwareSchema from '../../labware/schemas/2.json'
import {
  toWellName,
  sortWells,
  splitWellsOnColumn,
  getDisplayVolume,
  getAsciiVolumeUnits,
  ensureVolumeUnits,
} from '../helpers/index'

import type {
  LabwareDefinition2 as Definition,
  LabwareMetadata as Metadata,
  LabwareDimensions as Dimensions,
  LabwareBrand as Brand,
  LabwareParameters as Params,
  LabwareWell as Well,
  LabwareWellProperties as InputWell,
  LabwareWellMap as WellMap,
  LabwareWellGroup as WellGroup,
  LabwareOffset as Offset,
  LabwareVolumeUnits as VolumeUnits,
} from '../types'

// NOTE: leaving this 'beta' to reduce conflicts with future labware cloud namespaces
export const DEFAULT_CUSTOM_NAMESPACE = 'custom_beta'
const SCHEMA_VERSION = 2
const DEFAULT_BRAND_NAME = 'generic'

type Cell = {|
  row: number,
  column: number,
|}

// This represents creating a "range" of well names with step intervals included
// For example, starting at well "A1" with a column stride of 2 would result in
// the grid name being ordered as: "A1", "B1"..."A3", "B3"..etc
type GridStart = {|
  rowStart: string,
  colStart: string,
  rowStride: number,
  colStride: number,
|}

type InputParams = $Rest<Params, {| loadName: mixed |}>

type InputWellGroup = $Rest<WellGroup, {| wells: mixed |}>

export type BaseLabwareProps = {|
  metadata: Metadata,
  parameters: InputParams,
  dimensions: Dimensions,
  brand?: Brand,
  version?: number,
  namespace?: string,
  loadNamePostfix?: Array<string>,
  strict?: ?boolean, // If true, throws error on failed validation
|}

export type RegularLabwareProps = {|
  ...BaseLabwareProps,
  offset: Offset,
  grid: Cell,
  spacing: Cell,
  well: InputWell,
  group?: InputWellGroup,
|}

export type IrregularLabwareProps = {|
  ...BaseLabwareProps,
  offset: Array<Offset>,
  grid: Array<Cell>,
  spacing: Array<Cell>,
  well: Array<InputWell>,
  gridStart: Array<GridStart>,
  group?: Array<InputWellGroup>,
|}

const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validate = ajv.compile(labwareSchema)

function validateDefinition(
  definition: Definition,
  strict: ?boolean = true
): Definition {
  const valid = validate(definition)

  if (!valid) {
    console.error('Definition:', definition)
    console.error('Validation Errors:', validate.errors)
    if (strict) {
      throw new Error(
        'Generated labware failed to validate, please check your inputs'
      )
    }
  }

  return definition
}

export function _irregularWellName(
  rowIdx: number,
  colIdx: number,
  gridStart: GridStart
): string {
  const rowNum =
    rowIdx * gridStart.rowStride + gridStart.rowStart.charCodeAt(0) - 65
  const colNum = colIdx * gridStart.colStride + parseInt(gridStart.colStart) - 1
  return toWellName({ rowNum, colNum })
}

export function _calculateWellCoord(
  rowIdx: number,
  colIdx: number,
  spacing: Cell,
  offset: Offset,
  well: InputWell
): Well {
  const coords = {
    x: round(colIdx * spacing.column + offset.x, 2),
    y: round(rowIdx * spacing.row + offset.y, 2),
    z: round(offset.z - well.depth, 2),
  }
  // NOTE: Ian 2019-04-16 this silly "if circular" is to make Flow happy
  if (well.shape === 'circular') return { ...well, ...coords }
  return {
    ...well,
    ...coords,
  }
}

function determineIrregularLayout(
  grids: Array<Cell>,
  spacing: Array<Cell>,
  offset: Array<Offset>,
  gridStart: Array<GridStart>,
  wells: Array<InputWell>,
  group: Array<InputWellGroup> = []
): { wells: WellMap, groups: Array<WellGroup> } {
  return grids.reduce(
    (result, gridObj, gridIdx) => {
      const reverseRowIdx = range(gridObj.row - 1, -1)
      const inputGroup = group[gridIdx] || { metadata: {} }
      const currentGroup = { ...inputGroup, wells: [] }

      range(gridObj.column).forEach(colIdx => {
        range(gridObj.row).forEach(rowIdx => {
          const wellName = _irregularWellName(
            rowIdx,
            colIdx,
            gridStart[gridIdx]
          )
          currentGroup.wells.push(wellName)
          result.wells[wellName] = _calculateWellCoord(
            reverseRowIdx[rowIdx],
            colIdx,
            spacing[gridIdx],
            offset[gridIdx],
            wells[gridIdx]
          )
        })
      })

      return { wells: result.wells, groups: [...result.groups, currentGroup] }
    },
    { wells: {}, groups: [] }
  )
}

export function _generateIrregularLoadName(args: {
  grid: Array<Cell>,
  well: Array<InputWell>,
  totalWellCount: number,
  units: VolumeUnits,
  brand: string,
  displayCategory: string,
  loadNamePostfix?: Array<string>,
}): string {
  const {
    grid,
    well,
    totalWellCount,
    units,
    brand,
    displayCategory,
    loadNamePostfix = [],
  } = args
  const loadNameUnits = getAsciiVolumeUnits(units)
  const wellComboArray = grid.map((gridObj, gridIdx) => {
    const numWells = gridObj.row * gridObj.column
    const wellVolume = getDisplayVolume(well[gridIdx].totalLiquidVolume, units)

    return `${numWells}x${wellVolume}${loadNameUnits}`
  })

  return joinLoadName([
    brand,
    totalWellCount,
    displayCategory,
    wellComboArray,
    ...loadNamePostfix,
  ])
}

// Decide order of wells for single grid containers
function determineOrdering(grid: Cell): Array<Array<string>> {
  const ordering = range(grid.column).map(colNum =>
    range(grid.row).map(rowNum => toWellName({ rowNum, colNum }))
  )

  return ordering
}

// Decide order of wells for multi-grid containers
export function determineIrregularOrdering(
  wellsArray: Array<string>
): Array<Array<string>> {
  const sortedArray = wellsArray.sort(sortWells)
  const ordering = splitWellsOnColumn(sortedArray)

  return ordering
}

// Private helper functions to calculate the XYZ coordinates of a give well
// Will return a nested object of all well objects for a labware
function calculateCoordinates(
  wellProps: InputWell,
  ordering: Array<Array<string>>,
  spacing: Cell,
  offset: Offset,
  dimensions: Dimensions
): WellMap {
  const { yDimension } = dimensions

  return ordering.reduce<WellMap>((wellMap, column, cIndex) => {
    return column.reduce<WellMap>(
      (colWellMap, wellName, rIndex) => ({
        ...colWellMap,
        [wellName]: {
          ...wellProps,
          x: round(cIndex * spacing.column + offset.x, 2),
          y: round(yDimension - offset.y - rIndex * spacing.row, 2),
          z: round(offset.z - wellProps.depth, 2),
        },
      }),
      wellMap
    )
  }, {})
}

function ensureBrand(brand?: Brand): Brand {
  return brand || { brand: DEFAULT_BRAND_NAME }
}

// joins the input array with _ to create a name, making sure to lowercase the
// result and remove all invalid characters (allowed characters: [a-z0-9_.])
function joinLoadName(
  fragments: Array<string | number | Array<string | number>>
): string {
  return flatten(fragments)
    .map(s => String(s).replace(/_/g, ''))
    .join('_')
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '')
}

type RegularNameProps = {
  displayCategory: string,
  displayVolumeUnits: VolumeUnits,
  gridRows: number,
  gridColumns: number,
  totalLiquidVolume: number,
  brandName?: string,
  loadNamePostfix?: Array<string>,
}

export function createRegularLoadName(args: RegularNameProps): string {
  const {
    gridRows,
    gridColumns,
    displayCategory,
    totalLiquidVolume,
    displayVolumeUnits,
    brandName = DEFAULT_BRAND_NAME,
    loadNamePostfix = [],
  } = args
  const numWells = gridRows * gridColumns
  return joinLoadName([
    brandName,
    numWells,
    displayCategory,
    `${getDisplayVolume(
      totalLiquidVolume,
      displayVolumeUnits
    )}${getAsciiVolumeUnits(displayVolumeUnits)}`,
    ...loadNamePostfix,
  ])
}

const capitalize = (_s: string): string => {
  const s = _s.trim()
  return `${s.slice(0, 1).toUpperCase()}${s.slice(1)}`
}

// TODO: Ian 2019-08-23 consider using this in the labware creation functions instead of manually entering displayName
export function createDefaultDisplayName(args: RegularNameProps): string {
  const {
    gridRows,
    gridColumns,
    displayCategory,
    totalLiquidVolume,
    displayVolumeUnits,
    brandName = DEFAULT_BRAND_NAME,
    loadNamePostfix = [],
  } = args
  const numWells = gridRows * gridColumns
  return [
    ...brandName.split(' ').map(capitalize),
    numWells,
    capitalize(displayCategory.replace(/([a-z])([A-Z])/g, '$1 $2')),
    getDisplayVolume(totalLiquidVolume, displayVolumeUnits),
    displayVolumeUnits,
    ...loadNamePostfix.map(capitalize),
  ]
    .filter(s => s !== '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Generator function for labware definitions within a regular grid format
// e.g. well plates, regular tuberacks (NOT 15_50ml) etc.
// For further info on these parameters look at labware examples in __tests__
// or the labware definition schema in labware/schemas/
export function createRegularLabware(args: RegularLabwareProps): Definition {
  const { offset, dimensions, grid, spacing, well, loadNamePostfix } = args
  const strict = args.strict
  const version = args.version || 1
  const namespace = args.namespace || DEFAULT_CUSTOM_NAMESPACE
  const ordering = determineOrdering(grid)
  const brand = ensureBrand(args.brand)
  const groupBase = args.group || { metadata: {} }
  const metadata = {
    ...args.metadata,
    displayVolumeUnits: ensureVolumeUnits(args.metadata.displayVolumeUnits),
  }
  const loadName = createRegularLoadName({
    gridColumns: grid.column,
    gridRows: grid.row,
    displayCategory: metadata.displayCategory,
    displayVolumeUnits: metadata.displayVolumeUnits,
    totalLiquidVolume: well.totalLiquidVolume,
    brandName: brand.brand,
    loadNamePostfix,
  })

  return validateDefinition(
    {
      ordering,
      brand,
      metadata,
      dimensions,
      wells: calculateCoordinates(well, ordering, spacing, offset, dimensions),
      groups: [{ ...groupBase, wells: flatten(ordering) }],
      parameters: { ...args.parameters, loadName },
      namespace,
      version,
      schemaVersion: SCHEMA_VERSION,
      cornerOffsetFromSlot: { x: 0, y: 0, z: 0 },
    },
    strict
  )
}

// Generator function for labware definitions within an irregular grid format
// e.g. crystallization plates, 15_50ml tuberacks and anything with multiple "grids"
export function createIrregularLabware(
  args: IrregularLabwareProps
): Definition {
  const { offset, dimensions, grid, spacing, well, gridStart, group } = args
  const strict = args.strict
  const namespace = args.namespace || DEFAULT_CUSTOM_NAMESPACE
  const version = args.version || 1
  const { wells, groups } = determineIrregularLayout(
    grid,
    spacing,
    offset,
    gridStart,
    well,
    group
  )
  const brand = ensureBrand(args.brand)
  const metadata = {
    ...args.metadata,
    displayVolumeUnits: ensureVolumeUnits(args.metadata.displayVolumeUnits),
  }

  const loadName = _generateIrregularLoadName({
    grid,
    well,
    totalWellCount: Object.keys(wells).length,
    units: metadata.displayVolumeUnits,
    displayCategory: metadata.displayCategory,
    brand: brand.brand,
  })

  return validateDefinition(
    {
      wells,
      groups,
      brand,
      metadata,
      dimensions,
      parameters: { ...args.parameters, loadName, format: 'irregular' },
      ordering: determineIrregularOrdering(Object.keys(wells)),
      namespace,
      version,
      schemaVersion: SCHEMA_VERSION,
      cornerOffsetFromSlot: { x: 0, y: 0, z: 0 },
    },
    strict
  )
}
