import { describe, expect, test } from 'vitest'

import {
  computeLabwareOrigin,
  getAllDefinitions,
  getModuleDef,
  ot3StandardDeckV5 as ot3StandardDeckV5Untyped,
} from '../..'

import type { DeckDefinition } from '../..'

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
})
