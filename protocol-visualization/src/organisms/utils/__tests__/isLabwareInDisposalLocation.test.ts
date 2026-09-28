import { describe, expect, it } from 'vitest'

import {
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'

import { isLabwareInDisposalLocation } from '../isLabwareInDisposalLocation'

describe('isLabwareInDisposalLocation', () => {
  it('returns true for gripper waste chute where disposed tip rack lids stack', () => {
    expect(
      isLabwareInDisposalLocation(GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA)
    ).toBe(true)
  })

  it.each(MOVABLE_TRASH_ADDRESSABLE_AREAS)(
    'returns true for movable trash %s',
    trashSlot => {
      expect(isLabwareInDisposalLocation(trashSlot)).toBe(true)
    }
  )

  it('returns true for OT-2 fixed trash', () => {
    expect(isLabwareInDisposalLocation('fixedTrash')).toBe(true)
  })

  it('returns false for ordinary deck slots', () => {
    expect(isLabwareInDisposalLocation('D4')).toBe(false)
    expect(isLabwareInDisposalLocation('A1')).toBe(false)
  })
})
