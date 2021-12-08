import { when, resetAllWhenMocks } from 'jest-when'
import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'
import { getLabwareOffsetLocation } from '../getLabwareOffsetLocation'
import { getLabwareLocation } from '../getLabwareLocation'
import { getModuleInitialLoadInfo } from '../getModuleInitialLoadInfo'
import type { ProtocolFile } from '@opentrons/shared-data'

jest.mock('../getLabwareLocation')
jest.mock('../getModuleInitialLoadInfo')

const protocolWithTC = (_uncastedProtocolWithTC as unknown) as ProtocolFile<{}>

const mockGetLabwareLocation = getLabwareLocation as jest.MockedFunction<
  typeof getLabwareLocation
>
const mockGetModuleInitialLoadInfo = getModuleInitialLoadInfo as jest.MockedFunction<
  typeof getModuleInitialLoadInfo
>

describe('getLabwareOffsetLocation', () => {
  let MOCK_LABWARE_ID: string
  let MOCK_COMMANDS: ProtocolFile<{}>['commands']
  let MOCK_MODULES: ProtocolFile<{}>['modules']
  beforeEach(() => {
    MOCK_LABWARE_ID = 'some_labware'
    MOCK_COMMANDS = protocolWithTC.commands
    MOCK_MODULES = protocolWithTC.modules
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should return just the slot name if the labware is not on top of a module', () => {
    const MOCK_SLOT = '2'
    when(mockGetLabwareLocation)
      .calledWith(MOCK_LABWARE_ID, MOCK_COMMANDS)
      .mockReturnValue({ slotName: MOCK_SLOT })

    expect(
      getLabwareOffsetLocation(MOCK_LABWARE_ID, MOCK_COMMANDS, MOCK_MODULES)
    ).toEqual({ slotName: MOCK_SLOT })
  })
  it('should return the slot name and module model if the labware is on top of a module', () => {
    const TCIdInProtocol =
      '18f0c1b0-0122-11ec-88a3-f1745cf9b36c:thermocyclerModuleType' // this is just taken from the protocol fixture
    const TCModelInProtocol = 'thermocyclerModuleV1'
    const MOCK_SLOT = '2'
    when(mockGetLabwareLocation)
      .calledWith(MOCK_LABWARE_ID, MOCK_COMMANDS)
      .mockReturnValue({ moduleId: TCIdInProtocol })
    when(mockGetModuleInitialLoadInfo)
      .calledWith(TCIdInProtocol, MOCK_COMMANDS)
      .mockReturnValue({ location: { slotName: MOCK_SLOT } } as any)

    expect(
      getLabwareOffsetLocation(MOCK_LABWARE_ID, MOCK_COMMANDS, MOCK_MODULES)
    ).toEqual({ slotName: MOCK_SLOT, moduleModel: TCModelInProtocol })
  })
})
