// @flow
import { getSpacing } from '../labwareInference'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareFields, BooleanString } from './fields'

const boolToBoolString = (b: boolean): BooleanString => (b ? 'true' : 'false') // TODO IMMEDIATELY revisit, is this duplicated elsewhere?

// NOTE: this fn should always be passed an object valid under JSON schema for LabwareDefinition2
// TODO: Ian 2019-08-26 this shares functionality with getUniqueWellProperties fn in labware-library/src/definitions.js
export default function labwareDefToFields(
  def: LabwareDefinition2
): ?LabwareFields {
  // TODO IMMEDIATELY: use fns from labware-library/definitions.js ???
  const homogeneousWells = true
  const regularRowSpacing = true
  const regularColumnSpacing = true

  if (!homogeneousWells || !regularRowSpacing || !regularColumnSpacing) {
    // TODO IMMEDIATELY: somehow handle uploading "irregular" (multi-grid) labware, error messaging
    return null
  }

  // single well to use to represent the grid
  const well = def.wells.A1
  const allWells = Object.keys(def.wells).map(wellName => def.wells[wellName])

  const gridSpacingX = getSpacing(allWells, 'x')
  const gridSpacingY = getSpacing(allWells, 'y')

  const gridRowsNum = def.ordering[0].length
  const gridColumnsNum = def.ordering.length

  return {
    // NOTE: Ian 2019-08-26 these fields cannot be inferred
    labwareType: null,
    tubeRackInsertLoadName: null,
    aluminumBlockType: null,
    aluminumBlockChildType: null,

    footprintXDimension: String(def.dimensions.xDimension),
    footprintYDimension: String(def.dimensions.yDimension),
    labwareZDimension: String(def.dimensions.zDimension),

    // Missing values or zeroes for these fields should be translated to null
    gridRows: gridRowsNum > 0 ? String(gridRowsNum) : null,
    gridColumns: gridColumnsNum > 0 ? String(gridColumnsNum) : null,
    gridSpacingX:
      gridSpacingX == null || gridSpacingX <= 0 ? null : String(gridSpacingX),
    gridSpacingY:
      gridSpacingY == null || gridSpacingY <= 0 ? null : String(gridSpacingY),

    gridOffsetX: String(well.x),
    gridOffsetY: String(well.y),

    homogeneousWells: boolToBoolString(homogeneousWells),
    regularRowSpacing: boolToBoolString(regularRowSpacing),
    regularColumnSpacing: boolToBoolString(regularColumnSpacing),

    wellVolume: String(well.totalLiquidVolume),
    wellBottomShape: null, // TODO IMMEDIATELY how does LL infer this?
    wellDepth: String(well.depth),
    wellShape: well.shape,

    // used with circular well shape only
    wellDiameter: well.shape === 'circular' ? String(well.diameter) : null,

    // used with rectangular well shape only
    wellXDimension:
      well.shape === 'rectangular' ? String(well.xDimension) : null,
    wellYDimension:
      well.shape === 'rectangular' ? String(well.yDimension) : null,

    brand: def.brand.brand,
    brandId: (def.brand.brandId || []).join(','), // comma-separated values

    loadName: def.parameters.loadName,
    displayName: def.metadata.displayName,

    // fields for test protocol
    pipetteName: null,
  }
}
