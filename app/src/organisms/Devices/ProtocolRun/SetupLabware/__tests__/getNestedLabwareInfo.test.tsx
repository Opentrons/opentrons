import { mockDefinition } from '../../../../../redux/custom-labware/__fixtures__'
import { getNestedLabwareInfo } from '../getNestedLabwareInfo'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { LabwareSetupItem } from '../../../../../pages/Protocols/utils'

const MOCK_LABWARE_ID = 'mockLabwareId'
const MOCK_OTHER_LABWARE_ID = 'mockOtherLabwareId'
const MOCK_NICK_NAME = 'mockNickName'
const MOCK_MODULE_ID = 'mockModId'
const SLOT_NAME = 'A1'
describe('getNestedLabwareInfo', () => {
  it('should return null if the nestedLabware is null', () => {
    const mockLabwareSetupItem = {
      definition: mockDefinition,
      nickName: null,
      initialLocation: { slotName: SLOT_NAME },
      moduleModel: null,
      labwareId: MOCK_LABWARE_ID,
    } as LabwareSetupItem
    const mockCommands = [
      {
        id: '0abc3',
        commandType: 'loadLabware',
        params: {
          labwareId: MOCK_OTHER_LABWARE_ID,
          location: {
            slotName: '1',
          },
        },
        result: {
          labwareId: MOCK_OTHER_LABWARE_ID,
          definition: mockDefinition,
        },
      },
    ] as RunTimeCommand[]

    expect(getNestedLabwareInfo(mockLabwareSetupItem, mockCommands)).toBe(null)
  })

  it('should return nested labware info if nested labware is not null and adapter is on deck', () => {
    const mockLabwareSetupItem = {
      definition: mockDefinition,
      nickName: null,
      initialLocation: { slotName: SLOT_NAME },
      moduleModel: null,
      labwareId: MOCK_LABWARE_ID,
    } as LabwareSetupItem
    const mockCommands = [
      {
        id: '0abc3',
        commandType: 'loadLabware',
        params: {
          labwareId: MOCK_OTHER_LABWARE_ID,
          location: {
            labwareId: MOCK_LABWARE_ID,
          },
          displayName: MOCK_NICK_NAME,
        },
        result: {
          labwareId: MOCK_OTHER_LABWARE_ID,
          definition: mockDefinition,
        },
      },
    ] as RunTimeCommand[]

    expect(getNestedLabwareInfo(mockLabwareSetupItem, mockCommands)).toEqual({
      nestedLabwareDefinition: mockDefinition,
      nestedLabwareDisplayName: 'Mock Definition',
      nestedLabwareNickName: MOCK_NICK_NAME,
      sharedSlotId: SLOT_NAME,
    })
  })

  it('should return nested labware info if nested labware is not null and adapter is on a module', () => {
    const mockLabwareSetupItem = {
      definition: mockDefinition,
      nickName: null,
      initialLocation: { moduleId: MOCK_MODULE_ID },
      moduleModel: null,
      labwareId: MOCK_LABWARE_ID,
    } as LabwareSetupItem
    const mockCommands = [
      {
        id: '0abc3',
        commandType: 'loadLabware',
        params: {
          labwareId: MOCK_OTHER_LABWARE_ID,
          location: {
            labwareId: MOCK_LABWARE_ID,
          },
          displayName: MOCK_NICK_NAME,
        },
        result: {
          labwareId: MOCK_OTHER_LABWARE_ID,
          definition: mockDefinition,
        },
      },
      {
        id: '123',
        commandType: 'loadModule',
        params: {
          location: { slotName: SLOT_NAME },
        },
        result: {
          moduleId: MOCK_MODULE_ID,
        },
      },
    ] as RunTimeCommand[]

    expect(getNestedLabwareInfo(mockLabwareSetupItem, mockCommands)).toEqual({
      nestedLabwareDefinition: mockDefinition,
      nestedLabwareDisplayName: 'Mock Definition',
      nestedLabwareNickName: MOCK_NICK_NAME,
      sharedSlotId: SLOT_NAME,
    })
  })
})
