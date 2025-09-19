import { describe, expect, it } from 'vitest'

import fixedTrashUncasted from '../../../labware/definitions/2/opentrons_1_trash_3200ml_fixed/1.json'
import { getFixedTrashLabwareDefinition } from '../index'

import type { LabwareDefinition } from '../..'

describe('getFixedTrashLabwareDefinition', () => {
  it(`should return the fixed trash labware defition`, () => {
    expect(getFixedTrashLabwareDefinition()).toEqual(
      (fixedTrashUncasted as unknown) as LabwareDefinition
    )
  })
})
