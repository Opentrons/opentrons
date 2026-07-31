import { describe, expect, it, test } from 'vitest'

import {
  computeLabwareOrigin,
  getAllDefinitions,
  getDeckSlotOriginToLabwareOrigin,
  getLabwareViewBox,
  getModuleDef,
  getPositionFromSlotId,
  getSchema2Dimensions,
  ot3StandardDeckV5 as ot3StandardDeckV5Untyped,
} from '../..'

import type {
  AddressableArea,
  DeckDefinition,
  LabwareDefinition2,
  LabwareDefinition3,
} from '../..'

const OT3_DECK_DEF = ot3StandardDeckV5Untyped as unknown as DeckDefinition

describe('computeLabwareOrigin()', () => {
  // Preserving legacy misbehavior:
  // If we're computing the position of a schema 2 labware, the labware below
  // it don't contribute anything to its x or y offset. Only z.
  describe('legacy behavior of x and y when labware are stacked', () => {
    test('where the base is a deck slot', () => {
      // These test labware are chosen so the adapter has a nonzero cornerOffsetFromSlot,
      // and the tip rack has a zero stackingOffsetWithLabware x and y.
      //
      // The remainder of this test will check that the final x and y of the tip rack
      // follow the x and y of the underlying slot, NOT of the adapter.
      const adapter =
        getAllDefinitions()['opentrons/opentrons_flex_96_tiprack_adapter/1']
      const tipRack =
        getAllDefinitions()['opentrons/opentrons_flex_96_tiprack_1000ul/1']

      const result = computeLabwareOrigin({
        labwareDefinitionsTopToBottom: [tipRack, adapter],
        moduleDefinition: null,
        slotId: 'A1',
        deckDefinition: OT3_DECK_DEF,
      })
      const expected = {
        // x and y are the front-left of slot A1.
        // z is on the surface of the adapter.
        x: 0.0,
        y: 321.0,
        z: 11.0,
      }
      expect(result).toStrictEqual(expected)
    })

    test('where the base is a module', () => {
      const stackerModuleDef = getModuleDef('flexStackerModuleV1')
      const tipRackDef =
        getAllDefinitions()['opentrons/opentrons_flex_96_tiprack_1000ul/1']
      const lidDef =
        getAllDefinitions()['opentrons/opentrons_flex_tiprack_lid/1']

      const resultForTipRackAndLid = computeLabwareOrigin({
        labwareDefinitionsTopToBottom: [lidDef, tipRackDef],
        moduleDefinition: stackerModuleDef,
        slotId: 'C3',
        deckDefinition: OT3_DECK_DEF,
      })
      expect(resultForTipRackAndLid).toStrictEqual({
        x: 489,
        y: 107,
        z: 115.75,
      })

      const resultForTipRackOnly = computeLabwareOrigin({
        labwareDefinitionsTopToBottom: [tipRackDef],
        moduleDefinition: stackerModuleDef,
        slotId: 'C3',
        deckDefinition: OT3_DECK_DEF,
      })
      expect(resultForTipRackOnly).toStrictEqual({
        x: 489,
        y: 107,
        z: 31,
      })
    })
  })

  test('resolves collar origin on the vacuum module dock (vacuumModuleV1DockA4)', () => {
    // Recovery/move animations pass addressableAreaName vacuumModuleV1DockA4 as the
    // slot id. That AA is not in FLEX_CUTOUT_BY_SLOT_ID; position must still resolve
    // so the collar does not animate from off-deck.
    const collarDef =
      getAllDefinitions()['opentrons/opentrons_vacuum_manifold_collar_tall/1']

    const result = computeLabwareOrigin({
      labwareDefinitionsTopToBottom: [collarDef],
      moduleDefinition: null,
      slotId: 'vacuumModuleV1DockA4',
      deckDefinition: OT3_DECK_DEF,
    })

    // cutoutA3 [328, 321, 0] + vacuumModuleV1DockA4 offset [159.5, 0, 20]
    expect(result).toStrictEqual({
      x: 487.5,
      y: 321,
      z: 20,
    })
  })
})

describe('getPositionFromSlotId()', () => {
  it('returns coordinates for standard staging slot A4', () => {
    expect(getPositionFromSlotId('A4', OT3_DECK_DEF)).toStrictEqual([
      492, 321, 14.5,
    ])
  })

  it('returns coordinates for vacuum module dock addressable area', () => {
    expect(
      getPositionFromSlotId('vacuumModuleV1DockA4', OT3_DECK_DEF)
    ).toStrictEqual([487.5, 321, 20])
  })

  it('returns coordinates for vacuum module main addressable area', () => {
    expect(
      getPositionFromSlotId('vacuumModuleV1A3', OT3_DECK_DEF)
    ).toStrictEqual([328, 321, 19])
  })
})

describe('getSchema2Dimensions()', () => {
  it('should handle schema 2 definitions', () => {
    const definition: Partial<LabwareDefinition2> = {
      schemaVersion: 2,
      dimensions: {
        xDimension: 12.34,
        yDimension: 56.78,
        zDimension: 90.12,
      },
    }
    const result = getSchema2Dimensions(definition as LabwareDefinition2)
    expect(result).toStrictEqual({
      xDimension: 12.34,
      yDimension: 56.78,
      zDimension: 90.12,
    })
  })
  it('should handle schema 3 definitions', () => {
    const definition: Partial<LabwareDefinition3> = {
      schemaVersion: 3,
      extents: {
        total: {
          backLeftBottom: {
            x: -0.1,
            y: 2.0,
            z: -0.3,
          },
          frontRightTop: {
            x: 1.0,
            y: -0.2,
            z: 3.0,
          },
        },
      },
    }
    const result = getSchema2Dimensions(definition as LabwareDefinition3)
    expect(result).toStrictEqual({
      xDimension: 1.1,
      yDimension: 2.2,
      zDimension: 3.3,
    })
  })
})

describe('getLabwareViewBox()', () => {
  it('should handle schema 2 definitions', () => {
    const definition: Partial<LabwareDefinition2> = {
      schemaVersion: 2,
      dimensions: {
        xDimension: 200,
        yDimension: 100,
        zDimension: 10,
      },
      cornerOffsetFromSlot: {
        // Should not affect result.
        x: 999,
        y: 999,
        z: 999,
      },
    }
    const result = getLabwareViewBox(definition as LabwareDefinition2)
    const expectedResult: typeof result = {
      minX: 0,
      minY: 0,
      maxX: 200,
      maxY: 100,
      xDimension: 200,
      yDimension: 100,
    }
    expect(result).toStrictEqual(expectedResult)
  })
  it('should handle schema 3 definitions', () => {
    const definition: Partial<LabwareDefinition3> = {
      schemaVersion: 3,
      extents: {
        total: {
          backLeftBottom: {
            x: -20,
            y: 90,
            z: 0,
          },
          frontRightTop: {
            x: 180,
            y: -10,
            z: 10,
          },
        },
      },
    }
    const result = getLabwareViewBox(definition as LabwareDefinition3)
    const expectedResult: typeof result = {
      minX: -20,
      minY: -10,
      maxX: 180,
      maxY: 90,
      xDimension: 200,
      yDimension: 100,
    }
    expect(result).toStrictEqual(expectedResult)
  })
})

describe('getDeckSlotOriginToLabwareOrigin()', () => {
  it('should handle schema 2 labware definitions', () => {
    const labwareDef: Partial<LabwareDefinition2> = {
      schemaVersion: 2,
      cornerOffsetFromSlot: {
        // Should not affect result.
        x: 10,
        y: 20,
        z: 30,
      },
    }
    const addressableArea: Partial<AddressableArea> = {
      boundingBox: {
        xDimension: 200,
        yDimension: 100,
        zDimension: 0,
      },
    }
    const result = getDeckSlotOriginToLabwareOrigin(
      addressableArea as AddressableArea,
      labwareDef as LabwareDefinition2
    )
    const expectedResult = labwareDef.cornerOffsetFromSlot
    expect(result).toStrictEqual(expectedResult)
  })
  it('should handle schema 3 labware definitions', () => {
    const labwareDef: Partial<LabwareDefinition3> = {
      schemaVersion: 3,
      extents: {
        total: {
          backLeftBottom: { x: -10, y: 10, z: 0 },
          frontRightTop: { x: 210, y: -110, z: 1000 },
        },
      },
      features: {
        slotFootprintAsChild: {
          z: 0,
          backLeft: { x: 0, y: 0 },
          frontRight: { x: 200, y: -100 },
        },
      },
    }
    const addressableArea: Partial<AddressableArea> = {
      boundingBox: {
        xDimension: 2000,
        yDimension: 1000,
        zDimension: 0,
      },
    }
    const result = getDeckSlotOriginToLabwareOrigin(
      addressableArea as AddressableArea,
      labwareDef as LabwareDefinition3
    )
    const expectedResult: typeof result = {
      x: 0,
      y: 100,
      z: 0,
    }
    expect(result).toStrictEqual(expectedResult)
  })
})
