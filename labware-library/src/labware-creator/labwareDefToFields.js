// @flow
import flatten from 'lodash/flatten'
import isEqual from 'lodash/isEqual'
import round from 'lodash/round'
import omit from 'lodash/omit'
import { getSpacingIfUniform } from '../labwareInference'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareFields, BooleanString } from './fields'

// NOTE: this is just String() with some typing for flow
const boolToBoolString = (b: boolean): BooleanString => (b ? 'true' : 'false')

// NOTE: this fn should always be passed an object valid under JSON schema for LabwareDefinition2
// TODO: Ian 2019-08-26 this shares functionality with getUniqueWellProperties fn in labware-library/src/definitions.js
export default function labwareDefToFields(
  def: LabwareDefinition2
): ?LabwareFields {
  const groups = def.groups || []
  const allWells = flatten(def.ordering).map(wellName => def.wells[wellName])
  // single well we'll use to represent the entire labware if homogeneousWell is true
  const commonWell = def.wells.A1

  const wellDimKeys = ['x', 'y', 'z']
  const commonWellNoDims = omit(commonWell, wellDimKeys)
  const homogeneousWells = allWells.every(well =>
    isEqual(omit(well, wellDimKeys), commonWellNoDims)
  )

  // don't bother trying to infer row/col regularity, assume `groups` is correct. If `groups` is missing, assume irregular
  const gridSpacingX = getSpacingIfUniform(allWells, 'x')
  const gridSpacingY = getSpacingIfUniform(allWells, 'y')
  const regularColumnSpacing = gridSpacingX !== null
  const regularRowSpacing = gridSpacingY !== null

  let labwareType: $PropertyType<LabwareFields, 'labwareType'> | null = null

  if (
    def.metadata.displayCategory === 'wellPlate' ||
    def.metadata.displayCategory === 'tubeRack' ||
    def.metadata.displayCategory === 'aluminumBlock' ||
    def.metadata.displayCategory === 'reservoir'
  ) {
    labwareType = def.metadata.displayCategory
  }

  if (
    !homogeneousWells ||
    !regularRowSpacing ||
    !regularColumnSpacing ||
    labwareType === null
  ) {
    // TODO IMMEDIATELY: somehow handle uploading "irregular" (multi-grid) labware, error messaging
    console.warn('TODO! unhandled labware def', {
      homogeneousWells,
      regularColumnSpacing,
      regularRowSpacing,
      labwareType,
    })
    return null
  }

  // use first group, if it exists
  const group = groups[0] || null

  const gridRowsNum = def.ordering[0].length
  const gridColumnsNum = def.ordering.length

  return {
    // NOTE: Ian 2019-08-26 these fields cannot be inferred
    tubeRackInsertLoadName: null,
    aluminumBlockType: null,
    aluminumBlockChildType: null,

    labwareType,

    footprintXDimension: String(def.dimensions.xDimension),
    footprintYDimension: String(def.dimensions.yDimension),
    labwareZDimension: String(def.dimensions.zDimension),

    // Missing values or zeroes for these fields should be translated to null
    gridRows: gridRowsNum > 0 ? String(gridRowsNum) : null,
    gridColumns: gridColumnsNum > 0 ? String(gridColumnsNum) : null,
    gridSpacingX:
      gridSpacingX == null || gridSpacingX === 0 ? null : String(gridSpacingX),
    gridSpacingY:
      gridSpacingY == null || gridSpacingY === 0 ? null : String(gridSpacingY),

    gridOffsetX: String(commonWell.x),
    // y offset is dist btw labware 'top' (furthest in y) and first well y
    gridOffsetY: String(round(def.dimensions.yDimension - commonWell.y, 2)),

    homogeneousWells: boolToBoolString(homogeneousWells),
    regularRowSpacing: boolToBoolString(regularRowSpacing),
    regularColumnSpacing: boolToBoolString(regularColumnSpacing),

    wellVolume: String(commonWell.totalLiquidVolume),
    wellBottomShape: group?.metadata.wellBottomShape || null,
    wellDepth: String(commonWell.depth),
    wellShape: commonWell.shape,

    // used with circular well shape only
    wellDiameter:
      commonWell.shape === 'circular' ? String(commonWell.diameter) : null,

    // used with rectangular well shape only
    wellXDimension:
      commonWell.shape === 'rectangular' ? String(commonWell.xDimension) : null,
    wellYDimension:
      commonWell.shape === 'rectangular' ? String(commonWell.yDimension) : null,

    brand: def.brand.brand,
    brandId: def.brand.brandId ? def.brand.brandId.join(',') : null, // comma-separated values

    loadName: def.parameters.loadName,
    displayName: def.metadata.displayName,

    // fields for test protocol
    pipetteName: null,
  }
}
