import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'
import { getHasWasteChute } from '..'
import type { AdditionalEquipmentEntities } from '@opentrons/step-generation'

describe('getHasWasteChute', () => {
  it('returns false when there is no waste chute', () => {
    const mockId = 'mockId'
    const mockAdditionalEquipmentEntities = {
      mockId: {
        id: mockId,
        name: 'gripper',
      },
    } as AdditionalEquipmentEntities
    const result = getHasWasteChute(mockAdditionalEquipmentEntities)
    expect(result).toEqual(false)
  })
  it('returns true when there is a waste chute', () => {
    const mockId = 'mockId'
    const mockId2 = 'mockId2'
    const mockAdditionalEquipmentEntities = {
      mockId: {
        id: mockId,
        name: 'gripper',
      },
      mockId2: {
        id: mockId2,
        name: 'wasteChute',
        location: WASTE_CHUTE_CUTOUT,
      },
    } as AdditionalEquipmentEntities
    const result = getHasWasteChute(mockAdditionalEquipmentEntities)
    expect(result).toEqual(true)
  })
})
