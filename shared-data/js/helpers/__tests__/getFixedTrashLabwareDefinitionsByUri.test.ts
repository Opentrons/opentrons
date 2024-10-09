import { describe, it, expect } from 'vitest'
import { getFixedTrashLabwareDefinitionsByUri } from '../index'
import type { LabwareDefinition2 } from '../..'
import fixedTrashUncasted from '../../../labware/definitions/2/opentrons_1_trash_3200ml_fixed/1.json'

describe('getFixedTrashLabwareDefinitionsByUri', () => {
  it(`should return the fixed trash labware defition`, () => {
    expect(
      getFixedTrashLabwareDefinitionsByUri('opentrons_1_trash_3200ml_fixed')
    ).toEqual({
      opentrons_1_trash_3200ml_fixed: (fixedTrashUncasted as unknown) as LabwareDefinition2,
    })
  })
})
