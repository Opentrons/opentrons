// @flow
import {
  createRegularLabware,
  //   createIrregularLabware,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import type { ProcessedLabwareFields } from './fields'

export default function fieldsToLabware(
  fields: ProcessedLabwareFields
): LabwareDefinition2 {
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

    return createRegularLabware({
      metadata: {
        displayName: fields.displayName,
        displayCategory: fields.labwareType,
        displayVolumeUnits: 'µL',
        //   tags?: Array<string>, // TODO LATER?
      },
      parameters: {
        format: 'irregular', // TODO! Cannot use fields.labwareType, must be "96Standard", "384Standard", "trough", "irregular", or "trash"
        isTiprack: fields.labwareType === 'tiprack', // NOTE: 'tiprack' is not a possible labwareType now anyway
        //   tipLength?: number,
        isMagneticModuleCompatible: false, // TODO: how to determine?
        //   magneticModuleEngageHeight?: number, // TODO: how to determine?
        //   quirks?: Array<string>, // TODO: how to determine?
      },
      dimensions: {
        xDimension: fields.footprintXDimension,
        yDimension: fields.footprintYDimension,
        zDimension: fields.labwareZDimension,
      },
      brand: {
        brand: fields.brand,
        brandId: fields.brandId,
        //   links: []
      },
      version: 1,
      //   namespace: 'you can put a namespace here',
      //   loadNamePostfix: [], // TODO: ???
      offset: {
        x: fields.gridOffsetX,
        y: fields.gridOffsetY,
        // NOTE: must give wells a z offset b/c `well.z = offset.z - wellDepth`.
        // We don't account for lip in Labware Creator now, so labware's offset.z is the SAME as labwareZDimension.
        z: fields.labwareZDimension,
      },
      grid: {
        column: fields.gridColumns,
        row: fields.gridRows,
      },
      spacing: {
        column: fields.gridSpacingX,
        row: fields.gridSpacingY,
      },
      well: wellProperties,
      // group: {} // TODO: ???
    })
  } else {
    throw new Error('use of createIrregularLabware not yet implemented')
    // return createIrregularLabware({ TODO })
  }
}
