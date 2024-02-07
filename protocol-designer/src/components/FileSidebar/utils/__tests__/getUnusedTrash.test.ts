import { describe, expect, it } from 'vitest'
import { getUnusedTrash } from '../getUnusedTrash'
import { EIGHT_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA, ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA } from '@opentrons/shared-data'
import type { CreateCommand } from '@opentrons/shared-data'
import type { AdditionalEquipment } from '../../FileSidebar'

describe('getUnusedTrash', () => {
  it('returns true for unused trash bin', () => {
    const mockTrashId = 'mockTrashId'
    const mockTrash = {
      [mockTrashId]: {
        name: 'trashBin',
        id: mockTrashId,
        location: 'cutoutA3',
      },
    } as AdditionalEquipment

    expect(getUnusedTrash(mockTrash, [])).toEqual({
      trashBinUnused: true,
      wasteChuteUnused: false,
    })
  })
  it('returns false for unused trash bin', () => {
    const mockTrashId = 'mockTrashId'
    const mockTrash = {
      [mockTrashId]: {
        name: 'trashBin',
        id: mockTrashId,
        location: 'cutoutA3',
      },
    } as AdditionalEquipment
    const mockCommand = [
      {
        commandType: 'moveToAddressableArea',
        params: { addressableAreaName: 'movableTrashA3' },
      },
    ] as CreateCommand[]

    expect(getUnusedTrash(mockTrash, mockCommand)).toEqual({
      trashBinUnused: false,
      wasteChuteUnused: false,
    })
  })
  it('returns true for unused waste chute', () => {
    const wasteChute = 'wasteChuteId'
    const mockAdditionalEquipment = {
      [wasteChute]: {
        name: 'wasteChute',
        id: wasteChute,
        location: 'cutoutD3',
      },
    } as AdditionalEquipment
    expect(getUnusedTrash(mockAdditionalEquipment, [])).toEqual({
      trashBinUnused: false,
      wasteChuteUnused: true,
    })
  })
  it('returns false for unused waste chute with single channel', () => {
    const wasteChute = 'wasteChuteId'
    const mockAdditionalEquipment = {
      [wasteChute]: {
        name: 'wasteChute',
        id: wasteChute,
        location: 'cutoutD3',
      },
    } as AdditionalEquipment
    const mockCommand = [
      {
        commandType: 'moveToAddressableArea',
        params: {
          pipetteId: 'mockId',
          addressableAreaName: ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
        },
      },
    ] as CreateCommand[]
    expect(getUnusedTrash(mockAdditionalEquipment, mockCommand)).toEqual({
      trashBinUnused: false,
      wasteChuteUnused: false,
    })
  })
  it('returns false for unused waste chute with 8-channel', () => {
    const wasteChute = 'wasteChuteId'
    const mockAdditionalEquipment = {
      [wasteChute]: {
        name: 'wasteChute',
        id: wasteChute,
        location: 'cutoutD3',
      },
    } as AdditionalEquipment
    const mockCommand = [
      {
        commandType: 'moveToAddressableArea',
        params: {
          pipetteId: 'mockId',
          addressableAreaName: EIGHT_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
        },
      },
    ] as CreateCommand[]
    expect(getUnusedTrash(mockAdditionalEquipment, mockCommand)).toEqual({
      trashBinUnused: false,
      wasteChuteUnused: false,
    })
  })
  it('returns false for unused trash bin with moveToAddressableAreaForDropTip command', () => {
    const mockTrashId = 'mockTrashId'
    const mockTrash = {
      [mockTrashId]: {
        name: 'trashBin',
        id: mockTrashId,
        location: 'cutoutA3',
      },
    } as AdditionalEquipment
    const mockCommand = [
      {
        commandType: 'moveToAddressableAreaForDropTip',
        params: { addressableAreaName: 'movableTrashA3', pipetteId: 'mockPip' },
      },
    ] as CreateCommand[]

    expect(getUnusedTrash(mockTrash, mockCommand)).toEqual({
      trashBinUnused: false,
      wasteChuteUnused: false,
    })
  })
})
