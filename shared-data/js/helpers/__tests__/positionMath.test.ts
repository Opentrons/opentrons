import { describe, expect, test } from 'vitest'

import {
  computeLabwareOrigin,
  getAllDefinitions,
  ot3StandardDeckV5,
} from '../..'

describe('computeLabwareOrigin()', () => {
  test('legacy behavior of x and y when labware are stacked', () => {
    // The adapter has a nonzero cornerOffsetFromSlot and the tip rack has a zero
    // stackingOffsetWithLabware x and y. The x and y of the tip rack follow the
    // x and y of the underlying slot, NOT of the adapter.
    const adapter = getAllDefinitions()[
      'opentrons/opentrons_flex_96_tiprack_adapter/1'
    ]
    const tipRack = getAllDefinitions()[
      'opentrons/opentrons_flex_96_tiprack_1000ul/1'
    ]
    const result = computeLabwareOrigin({
      labwareDefinitionsTopToBottom: [tipRack, adapter],
      moduleDefinition: null,
      slotId: 'A1',
      deckDefinition: ot3StandardDeckV5 as any,
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
})
