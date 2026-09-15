import { describe, expect, it } from 'vitest'

import { getLabwareStackForSlot } from '../getLabwareStackForSlot'

describe('getLabwareStackForSlot', () => {
  it('returns the off-deck stack when slot is offDeck and labwareId is provided', () => {
    const labware = {
      offDeckPlateId: {
        stack: ['offDeckPlateId', 'offDeck'],
      },
      otherOffDeckPlateId: {
        stack: ['otherOffDeckPlateId', 'offDeck'],
      },
    }

    expect(
      getLabwareStackForSlot(labware, 'offDeck', 'offDeckPlateId')
    ).toEqual(['offDeckPlateId', 'offDeck'])
  })

  it('returns an empty array for offDeck without a labwareId', () => {
    const labware = {
      offDeckPlateId: {
        stack: ['offDeckPlateId', 'offDeck'],
      },
    }

    expect(getLabwareStackForSlot(labware, 'offDeck')).toEqual([])
  })
})
