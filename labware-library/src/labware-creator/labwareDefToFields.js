// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { getUniqueWellProperties } from '../labwareInference'
import type { LabwareFields, BooleanString } from './fields'

// NOTE: this is just String() with some typing for flow
const boolToBoolString = (b: boolean): BooleanString => (b ? 'true' : 'false')

export function labwareDefToFields(def: LabwareDefinition2): ?LabwareFields {
  const allUniqueWellGroupProps = getUniqueWellProperties(def)

  if (allUniqueWellGroupProps.length === 0) {
    console.warn(
      'cannot get unique well props for definition, maybe it has missing/incomplete "groups" data?',
      def
    )
    return null
  }

  const {
    xSpacing,
    ySpacing,
    shape,
    depth,
    metadata,
    totalLiquidVolume,
    xOffsetFromLeft,
    yOffsetFromTop,
  } = allUniqueWellGroupProps[0]

  const homogeneousWells =
    allUniqueWellGroupProps.length === 1 &&
    shape !== null &&
    depth !== null &&
    totalLiquidVolume !== null

  // TODO: Ian 2019-08-28 once LC supports multiple groupds, num of rows / num of columns should
  // come from getUniqueWellProperties. Using `ordering` won't extend to multiple groups
  const gridRowsNum = def.ordering[0].length
  const gridColumnsNum = def.ordering.length

  const regularColumnSpacing = xSpacing !== null
  const regularRowSpacing = ySpacing !== null

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
    labwareType === null ||
    !(shape !== null && depth !== null && totalLiquidVolume !== null)
  ) {
    console.warn(
      'this labware def is more heterogeneous than LC can currently support',
      {
        homogeneousWells,
        regularColumnSpacing,
        regularRowSpacing,
        labwareType,
        allUniqueWellGroupProps,
      }
    )
    return null
  }

  return {
    // NOTE: Ian 2019-08-26 these LC-specific fields cannot easily/reliably be inferred
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
    gridSpacingX: xSpacing == null || xSpacing === 0 ? null : String(xSpacing),
    gridSpacingY: ySpacing == null || ySpacing === 0 ? null : String(ySpacing),

    gridOffsetX: String(xOffsetFromLeft),
    gridOffsetY: String(yOffsetFromTop),

    homogeneousWells: boolToBoolString(homogeneousWells),
    regularRowSpacing: boolToBoolString(regularRowSpacing),
    regularColumnSpacing: boolToBoolString(regularColumnSpacing),

    wellVolume: String(totalLiquidVolume),
    wellBottomShape: metadata.wellBottomShape || null,
    wellDepth: String(depth),
    wellShape: shape.shape,

    // used with circular well shape only
    wellDiameter: shape.shape === 'circular' ? String(shape.diameter) : null,

    // used with rectangular well shape only
    wellXDimension:
      shape.shape === 'rectangular' ? String(shape.xDimension) : null,
    wellYDimension:
      shape.shape === 'rectangular' ? String(shape.yDimension) : null,

    brand: def.brand.brand,
    brandId: def.brand.brandId ? def.brand.brandId.join(',') : null, // comma-separated values

    // NOTE: intentionally null these fields, do not import them
    loadName: null,
    displayName: null,

    // fields for test protocol
    pipetteName: null,
  }
}
