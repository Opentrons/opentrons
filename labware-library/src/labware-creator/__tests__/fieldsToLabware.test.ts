import { describe, expect, it } from 'vitest'

import { getDefaultFormState } from '../fields'
import { fieldsToLabware } from '../fieldsToLabware'
import { labwareFormSchema } from '../labwareFormSchema'

import type { ProcessedLabwareFields } from '../fields'

const validFilterPlateForm = {
  ...getDefaultFormState(),
  labwareType: 'filterPlate' as const,
  hasLpcQuirk: 'false' as const,
  footprintXDimension: '127.76',
  footprintYDimension: '85.48',
  labwareZDimension: '35',
  skirtHeight: '10',
  gridRows: '8',
  gridColumns: '12',
  gridSpacingX: '9',
  gridSpacingY: '9',
  gridOffsetX: '14',
  gridOffsetY: '11',
  homogeneousWells: 'true' as const,
  regularRowSpacing: 'true' as const,
  regularColumnSpacing: 'true' as const,
  wellVolume: '300',
  wellBottomShape: 'flat' as const,
  wellDepth: '20',
  wellShape: 'circular' as const,
  wellDiameter: '6.4',
  brand: 'TestBrand',
  loadName: 'test_filter_plate_skirt',
  displayName: 'Test Filter Plate Skirt',
}

const filterPlateFields = (
  hasLpcQuirk: ProcessedLabwareFields['hasLpcQuirk']
): ProcessedLabwareFields => ({
  labwareType: 'filterPlate',
  tubeRackInsertLoadName: '',
  aluminumBlockType: '',
  aluminumBlockChildType: null,
  handPlacedTipFit: null,
  footprintXDimension: 127.76,
  footprintYDimension: 85.48,
  labwareZDimension: 14.22,
  skirtHeight: 2.5,
  stackedLabwareZDimension: 0,
  gridRows: 8,
  gridColumns: 12,
  gridSpacingX: 9,
  gridSpacingY: 9,
  gridOffsetX: 14.38,
  gridOffsetY: 11.24,
  homogeneousWells: 'true',
  regularRowSpacing: 'true',
  regularColumnSpacing: 'true',
  wellVolume: 300,
  wellBottomShape: 'flat',
  wellDepth: 10,
  wellShape: 'circular',
  hasLpcQuirk,
  wellDiameter: 6.4,
  wellXDimension: 0,
  wellYDimension: 0,
  brand: 'Millipore',
  brandId: ['ABC123'],
  groupBrand: '',
  groupBrandId: [],
  loadName: 'custom_filter_plate',
  displayName: 'Custom Filter Plate',
  compatibleAdapters: {},
  compatibleModules: {},
})

describe('fieldsToLabware filter plates', () => {
  it('sets the filter plate display category, quirk, and deck incompatibility', () => {
    const def = fieldsToLabware(filterPlateFields('true'))

    expect(def.metadata.displayCategory).toBe('filterPlate')
    expect(def.parameters.quirks).toEqual([
      'filterPlate',
      'noLabwarePositionCheck',
    ])
    expect(def.parameters.isDeckSlotCompatible).toBe(false)
    expect(def.parameters.isTiprack).toBe(false)
    expect(def.parameters.loadName).toBe('custom_filter_plate')
    expect(def.dimensions.zDimension).toBe(14.22)
    expect(def.skirtHeight).toBe(2.5)
    expect(def.wells.A1.z).toBe(4.22)
    expect(def.gripHeightFromLabwareBottom).toBe(11.72)
    expect(def.stackingOffsetWithLabware?.default).toEqual({
      x: 0,
      y: 0,
      z: 0,
    })
  })

  it('allows a skirt height of 0', async () => {
    const cast = await labwareFormSchema.validate({
      ...validFilterPlateForm,
      skirtHeight: '0',
    })

    expect(cast.skirtHeight).toBe(0)
  })

  it('allows a filter plate when skirt height is left blank', async () => {
    const cast = await labwareFormSchema.validate({
      ...validFilterPlateForm,
      skirtHeight: '',
    })

    expect(cast.skirtHeight).toBe(0)
  })

  it('accepts a spacer taller than the wells below the skirt', async () => {
    const cast = await labwareFormSchema.validate({
      ...validFilterPlateForm,
      compatibleAdapters: {
        'opentrons_vacuum_manifold_spacer_7.25mm': '10',
      },
    })
    expect(cast.skirtHeight).toBe(10)
  })

  it('keeps total height as extents and infers tip below as height minus depth', () => {
    const def = fieldsToLabware({
      ...filterPlateFields('true'),
      labwareZDimension: 35,
      skirtHeight: 10,
      wellDepth: 20,
    })

    expect(def.dimensions.zDimension).toBe(35)
    expect(def.wells.A1.depth).toBe(20)
    expect(def.wells.A1.z).toBe(15)
    expect(def.skirtHeight).toBe(10)
    expect(def.gripHeightFromLabwareBottom).toBe(32.5)
  })

  it('rejects a well deeper than the labware height', async () => {
    await expect(
      labwareFormSchema.validate({
        ...validFilterPlateForm,
        labwareZDimension: '35',
        wellDepth: '40',
      })
    ).rejects.toThrow(/Well depth cannot exceed labware height/)
  })

  it('keeps a shallower well inside the plate', () => {
    const def = fieldsToLabware({
      ...filterPlateFields('true'),
      labwareZDimension: 70,
      skirtHeight: 0,
      wellDepth: 65,
    })

    expect(def.dimensions.zDimension).toBe(70)
    expect(def.wells.A1.depth).toBe(65)
    expect(def.wells.A1.z).toBe(5)
    expect(def.skirtHeight).toBeUndefined()
    expect(def.stackingOffsetWithLabware?.default).toEqual({
      x: 0,
      y: 0,
      z: 0,
    })
  })

  it('always excludes filter plates from labware position check', () => {
    const def = fieldsToLabware(filterPlateFields('false'))

    expect(def.parameters.quirks).toEqual([
      'filterPlate',
      'noLabwarePositionCheck',
    ])
  })
})
