import { describe, expect, test } from 'vitest'

import {
  computeLabwareOrigin,
  getAllDefinitions,
  ot3StandardDeckV5,
} from '../..'

describe('computeLabwareOrigin()', () => {
  test('legacy behavior of x and y when labware are stacked', () => {
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
      // Bottom-left of slot A1.
      x: 0.0,
      y: 321.0,
      z: 0.0,
    }
    expect(result).toStrictEqual(expected)
  })
})
