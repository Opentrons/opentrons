import { getUnusedStagingAreas } from '../getUnusedStagingAreas'
import type { CreateCommand } from '@opentrons/shared-data'
import type { AdditionalEquipment } from '../../FileSidebar'

describe('getUnusedStagingAreas', () => {
  it('returns true for unused staging area', () => {
    const stagingArea = 'stagingAreaId'
    const mockAdditionalEquipment = {
      [stagingArea]: { name: 'stagingArea', id: stagingArea, location: 'A3' },
    } as AdditionalEquipment

    expect(getUnusedStagingAreas(mockAdditionalEquipment, [])).toEqual(['A4'])
  })
  it('returns true for multi unused staging areas', () => {
    const stagingArea = 'stagingAreaId'
    const stagingArea2 = 'stagingAreaId2'
    const mockAdditionalEquipment = {
      [stagingArea]: { name: 'stagingArea', id: stagingArea, location: 'A3' },
      [stagingArea2]: { name: 'stagingArea', id: stagingArea2, location: 'B3' },
    } as AdditionalEquipment

    expect(getUnusedStagingAreas(mockAdditionalEquipment, [])).toEqual([
      'A4',
      'B4',
    ])
  })
  it('returns false for unused staging area', () => {
    const stagingArea = 'stagingAreaId'
    const mockAdditionalEquipment = {
      [stagingArea]: { name: 'stagingArea', id: stagingArea, location: 'A3' },
    } as AdditionalEquipment
    const mockCommand = ([
      {
        stagingArea: {
          commandType: 'loadLabware',
          params: { location: { slotName: 'A4' } },
        },
      },
    ] as unknown) as CreateCommand[]

    expect(
      getUnusedStagingAreas(mockAdditionalEquipment, mockCommand)
    ).toEqual(['A4'])
  })
})
