import { describe, expect, it } from 'vitest'
import type { LabwareDefinition2 } from '../..'
import fixedTrashUncasted from '../../../labware/definitions/2/opentrons_1_trash_3200ml_fixed/1.json'
import { getFixedTrashLabwareDefinition } from '../index'

describe('getFixedTrashLabwareDefinition', () => {
  it(`should return the fixed trash labware defition`, () => {
    expect(getFixedTrashLabwareDefinition()).toEqual(
      (fixedTrashUncasted as unknown) as LabwareDefinition2
    )
  })
})
