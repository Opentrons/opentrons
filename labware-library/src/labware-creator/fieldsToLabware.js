// @flow
import {
  createRegularLabware,
  //   createIrregularLabware,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import type { ProcessedLabwareFields } from './fields'

export default function fieldsToLabware(
  allFields: ProcessedLabwareFields
): LabwareDefinition2 {
  const fields = {
    ...allFields.labwareTypeFields,
    ...allFields.wellShapeFields,
    ...allFields.commonFields,
  }
  const isRegularLabware = true // TODO IMMEDIATELY derive from fields, I think only the 15-50-esque tube rack has multiple grids.

  if (isRegularLabware) {
    const commonWellProperties = {
      depth: fields.wellDepth,
      totalLiquidVolume: fields.wellVolume,
    }
    const wellProperties =
      fields.wellShape === 'circular'
        ? {
            ...commonWellProperties,
            shape: 'circular',
            diameter: fields.wellDiameter,
          }
        : {
            ...commonWellProperties,
            shape: 'rectangular',
            xDimension: fields.wellXDimension,
            yDimension: fields.wellYDimension,
          }

    // TODO IMMEDIATELY derive these
    const columnSpacing = 12
    const rowSpacing = 14

    return createRegularLabware({
      metadata: {
        displayName: fields.displayName,
        displayCategory: fields.labwareType,
        displayVolumeUnits: 'µL',
        //   tags?: Array<string>, // TODO: ???
      },
      parameters: {
        format: fields.labwareType,
        isTiprack: fields.labwareType === 'tiprack', // NOTE: 'tiprack' is not a possible labwareType now anyway
        //   tipLength?: number,
        isMagneticModuleCompatible: false, // TODO: how to determine?
        //   magneticModuleEngageHeight?: number, // TODO: how to determine?
        //   quirks?: Array<string>,
      },
      dimensions: {
        xDimension: fields.footprintXDimension,
        yDimension: fields.footprintYDimension,
        zDimension: fields.labwareZDimension, // TODO: why labware vs footprint distinction in the field names?
      },
      brand: {
        brand: fields.brand,
        //   brandId: [],
        //   links: []
      },
      version: 1,
      namespace: 'ot_custom', // TODO IMMEDIATELY verify that's the conventional custom labware
      //   loadNamePostfix: [], // TODO: ???
      offset: { x: fields.gridOffsetX, y: fields.gridOffsetY, z: 0 /* ??? */ },
      grid: {
        column: fields.gridColumns,
        row: fields.gridRows,
      },
      spacing: {
        column: columnSpacing,
        row: rowSpacing,
      },
      well: wellProperties,
      // group: {} // TODO: ???
    })
  } else {
    throw new Error('use of createIrregularLabware not yet implemented')
    // return createIrregularLabware({ TODO })
  }
}
