import { FLEX_TRASH_DEF_URI } from '../../../../constants'
import { getUnusedTrash } from '../getUnusedTrash'
import type { CreateCommand } from '@opentrons/shared-data'
import type { InitialDeckSetup } from '../../../../step-forms'
import type { AdditionalEquipment } from '../../FileSidebar'

describe('getUnusedTrash', () => {
  it('returns true for unused trash bin', () => {
    const labwareId = 'mockLabwareId'
    const mockTrash = ({
      [labwareId]: { labwareDefURI: FLEX_TRASH_DEF_URI, id: labwareId },
    } as unknown) as InitialDeckSetup['labware']

    expect(getUnusedTrash(mockTrash, {}, [])).toEqual({
      trashBinUnused: true,
      wasteChuteUnused: false,
    })
  })
  it('returns false for unused trash bin', () => {
    const labwareId = 'mockLabwareId'
    const mockTrash = ({
      [labwareId]: { labwareDefURI: FLEX_TRASH_DEF_URI, id: labwareId },
    } as unknown) as InitialDeckSetup['labware']
    const mockCommand = ([
      {
        labwareId: {
          commandType: 'dropTip',
          params: { labwareId: labwareId },
        },
      },
    ] as unknown) as CreateCommand[]

    expect(getUnusedTrash(mockTrash, {}, mockCommand)).toEqual({
      trashBinUnused: true,
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
    expect(getUnusedTrash({}, mockAdditionalEquipment, [])).toEqual({
      trashBinUnused: false,
      wasteChuteUnused: true,
    })
  })
  it('returns false for unused waste chute', () => {
    const wasteChute = 'wasteChuteId'
    const mockAdditionalEquipment = {
      [wasteChute]: {
        name: 'wasteChute',
        id: wasteChute,
        location: 'cutoutD3',
      },
    } as AdditionalEquipment
    const mockCommand = ([
      {
        labwareId: {
          commandType: 'moveToAddressableArea',
          params: {
            pipetteId: 'mockId',
            addressableAreaName: '1and8ChannelWasteChute',
          },
        },
      },
    ] as unknown) as CreateCommand[]
    expect(getUnusedTrash({}, mockAdditionalEquipment, mockCommand)).toEqual({
      trashBinUnused: false,
      wasteChuteUnused: true,
    })
  })
})
