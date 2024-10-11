import { describe, it, expect } from 'vitest'
import { getFixedTrashLabwareDefinition } from '../index'
import type { LabwareDefinition2 } from '../..'
import fixedTrashUncasted from '../../../labware/definitions/2/opentrons_1_trash_3200ml_fixed/1.json'

describe('getFixedTrashLabwareDefinition', () => {
  it(`should return the fixed trash labware defition`, () => {
    expect(getFixedTrashLabwareDefinition()).toEqual(
      (fixedTrashUncasted as unknown) as LabwareDefinition2
    )
  })
})
