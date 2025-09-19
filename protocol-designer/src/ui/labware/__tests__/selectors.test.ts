import { describe, expect, it } from 'vitest'

import { getDisposalOptions } from '../selectors'

describe('labware selectors', () => {
  describe('getDisposalOptions', () => {
    it('returns an empty list when additionalEquipment is NOT provided', () => {
      expect(getDisposalOptions.resultFunc({}, null)).toEqual([])
    })
    it('returns empty list when trash bin is NOT present', () => {
      const additionalEquipmentEntities = {
        stagingArea: {
          name: 'stagingArea' as const,
          location: 'cutoutB3',
          id: 'stagingAreaId',
        },
      }
      expect(
        getDisposalOptions.resultFunc(additionalEquipmentEntities, null)
      ).toEqual([])
    })
    it('filters out additional equipment that is not trash when a trash is present', () => {
      const mockTrashId = 'mockTrashId'
      const additionalEquipmentEntities = {
        stagingArea: {
          name: 'stagingArea',
          location: 'cutoutB3',
          id: 'staginAreaId',
        },
        [mockTrashId]: {
          name: 'trashBin',
          location: 'cutoutA3',
          id: mockTrashId,
        },
      }

      expect(
        // @ts-expect-error(sa, 2021-6-15): resultFunc
        getDisposalOptions.resultFunc(additionalEquipmentEntities)
      ).toEqual([{ name: 'Trash bin', value: mockTrashId }])
    })
    it('filters out additional equipment that is NOT trash when multiple trash bins present', () => {
      const mockTrashId = 'mockTrashId'
      const mockTrashId2 = 'mockTrashId2'
      const additionalEquipmentEntities = {
        stagingArea: {
          name: 'stagingArea',
          location: 'cutoutB3',
          id: 'staginAreaId',
        },
        [mockTrashId]: {
          name: 'trashBin',
          location: 'cutoutA3',
          id: mockTrashId,
        },
        [mockTrashId2]: {
          name: 'trashBin',
          location: 'cutoutA1',
          id: mockTrashId2,
        },
      }

      expect(
        // @ts-expect-error(sa, 2021-6-15): resultFunc
        getDisposalOptions.resultFunc(additionalEquipmentEntities)
      ).toEqual([
        { name: 'Trash bin', value: mockTrashId },
        { name: 'Trash bin', value: mockTrashId2 },
      ])
    })
  })
})
