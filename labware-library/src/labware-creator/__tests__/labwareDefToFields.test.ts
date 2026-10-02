import { describe, expect, it, vi } from 'vitest'

import {
  fixture_12_trough,
  fixture_24_tuberack,
  fixture_96_plate,
  fixture_irregular_example_1,
} from '@opentrons/shared-data/labware/fixtures/2'

import { labwareDefToFields } from '../labwareDefToFields'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../definitions')

describe('labwareDefToFields', () => {
  it('fixture_96_plate', () => {
    const def = fixture_96_plate
    const result = labwareDefToFields(
      def as LabwareDefinition2,
      [def, def] as LabwareDefinition2[]
    )
    expect(result).toEqual({
      labwareType: 'wellPlate',
      tubeRackInsertLoadName: null,
      aluminumBlockType: null,
      aluminumBlockChildType: null,
      handPlacedTipFit: null,

      footprintXDimension: String(def.dimensions.xDimension),
      footprintYDimension: String(def.dimensions.yDimension),
      labwareZDimension: String(def.dimensions.zDimension),
      skirtHeight: '0',

      gridRows: '8',
      gridColumns: '12',
      gridSpacingX: '9',
      gridSpacingY: '9',
      gridOffsetX: String(def.wells.A1.x),
      gridOffsetY: '11.24',

      homogeneousWells: 'true',
      hasLpcQuirk: 'false',
      regularRowSpacing: 'true',
      regularColumnSpacing: 'true',

      wellVolume: '380',
      wellBottomShape: 'flat',
      wellDepth: '10.54',
      wellShape: 'circular',

      wellDiameter: '6.4',

      // used with rectangular well shape only
      wellXDimension: null,
      wellYDimension: null,

      brand: 'generic',
      brandId: null,

      loadName: null, // should be cleared
      displayName: null, // should be cleared

      stackedLabwareZDimension: null, // should not exist
      compatibleAdapters: {},
      compatibleModules: {},
    })
  })

  it('fixture_12_trough', () => {
    // make sure rectangular wells + single row works as expected
    const def = fixture_12_trough
    const result = labwareDefToFields(
      def as LabwareDefinition2,
      [def, def] as LabwareDefinition2[]
    )

    expect(result?.labwareType).toEqual('reservoir')
    expect(result?.gridSpacingY).toBe(null) // single row -> null Y-spacing
    expect(result?.wellDiameter).toBe(null)
    expect(result).toMatchSnapshot()
  })

  it('fixture_irregular_example_1 should return null (until multi-grid labware is supported in LC)', () => {
    const def = fixture_irregular_example_1
    const result = labwareDefToFields(
      def as LabwareDefinition2,
      [def, def] as LabwareDefinition2[]
    )
    expect(result).toEqual(null)
  })

  it('fixture_24_tuberack should match snapshot', () => {
    const def = fixture_24_tuberack
    const result = labwareDefToFields(
      def as LabwareDefinition2,
      [def, def] as LabwareDefinition2[]
    )

    expect(result?.labwareType).toEqual('tubeRack')
    expect(result?.brand).toBe('Opentrons')
    expect(result?.brandId).toBe('649020')
    expect(result?.groupBrand).toBe('tube brand here')
    expect(result?.groupBrandId).toBe('tube123,other123')

    expect(result).toMatchSnapshot()
  })

  it('maps a filterPlate definition back to the filter plate labware type', () => {
    const def = {
      ...fixture_96_plate,
      metadata: {
        ...fixture_96_plate.metadata,
        displayCategory: 'filterPlate',
      },
      parameters: {
        ...fixture_96_plate.parameters,
        quirks: ['filterPlate', 'noLabwarePositionCheck'],
      },
      skirtHeight: 5,
    } as LabwareDefinition2

    const result = labwareDefToFields(def, [def])

    expect(result?.labwareType).toEqual('filterPlate')
    expect(result?.hasLpcQuirk).toEqual('true')
    expect(result?.skirtHeight).toEqual('5')
    expect(result?.labwareZDimension).toEqual(
      String(fixture_96_plate.dimensions.zDimension)
    )
  })

  it('keeps total height as zDimension when wells hang past the skirt', () => {
    const def = {
      ...fixture_96_plate,
      dimensions: {
        ...fixture_96_plate.dimensions,
        zDimension: 35,
      },
      skirtHeight: 10,
    } as LabwareDefinition2

    const result = labwareDefToFields(def, [def])

    expect(result?.labwareZDimension).toEqual('35')
    expect(result?.skirtHeight).toEqual('10')
    expect(result?.wellDepth).toEqual('10.54')
  })

  it('treats a well plate with the filterPlate quirk as a filter plate', () => {
    const def = {
      ...fixture_96_plate,
      parameters: {
        ...fixture_96_plate.parameters,
        quirks: ['filterPlate'],
      },
    } as LabwareDefinition2

    const result = labwareDefToFields(def, [def])

    expect(result?.labwareType).toEqual('filterPlate')
    expect(result?.hasLpcQuirk).toEqual('false')
  })
})
