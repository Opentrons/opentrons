import { describe, expect, it } from 'vitest'
import { getUnusedStagingAreas } from '../getUnusedStagingAreas'
import type { CreateCommand } from '@opentrons/shared-data'
import type { AdditionalEquipment } from '../../FileSidebar'

describe('getUnusedStagingAreas', () => {
  it('returns true for unused staging area', () => {
    const stagingArea = 'stagingAreaId'
    const mockAdditionalEquipment = {
      [stagingArea]: {
        name: 'stagingArea',
        id: stagingArea,
        location: 'cutoutA3',
      },
    } as AdditionalEquipment

    expect(getUnusedStagingAreas(mockAdditionalEquipment, [])).toEqual(['A4'])
  })
  it('returns true for multi unused staging areas', () => {
    const stagingArea = 'stagingAreaId'
    const stagingArea2 = 'stagingAreaId2'
    const mockAdditionalEquipment = {
      [stagingArea]: {
        name: 'stagingArea',
        id: stagingArea,
        location: 'cutoutA3',
      },
      [stagingArea2]: {
        name: 'stagingArea',
        id: stagingArea2,
        location: 'cutoutB3',
      },
    } as AdditionalEquipment

    expect(getUnusedStagingAreas(mockAdditionalEquipment, [])).toEqual([
      'A4',
      'B4',
    ])
  })
  it('returns false for unused staging area', () => {
    const stagingArea = 'stagingAreaId'
    const mockAdditionalEquipment = {
      [stagingArea]: {
        name: 'stagingArea',
        id: stagingArea,
        location: 'cutoutA3',
      },
    } as AdditionalEquipment
    const mockCommand = [
      {
        commandType: 'loadLabware',
        params: { location: { addressableAreaName: 'A4' } },
      },
    ] as CreateCommand[]

    expect(getUnusedStagingAreas(mockAdditionalEquipment, mockCommand)).toEqual(
      []
    )
  })
})
