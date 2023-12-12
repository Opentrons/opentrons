import { when, resetAllWhenMocks } from 'jest-when'
import {
  CompletedProtocolAnalysis,
  getLabwareDefURI,
} from '@opentrons/shared-data'
import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'
import fixture_adapter from '@opentrons/shared-data/labware/definitions/2/opentrons_96_pcr_adapter/1.json'
import { getLabwareOffsetLocation } from '../getLabwareOffsetLocation'
import { getLabwareLocation } from '../getLabwareLocation'
import { getModuleInitialLoadInfo } from '../getModuleInitialLoadInfo'
import type {
  LoadedLabware,
  LoadedModule,
  LabwareDefinition2,
} from '@opentrons/shared-data'

jest.mock('../getLabwareLocation')
jest.mock('../getModuleInitialLoadInfo')

const protocolWithTC = (_uncastedProtocolWithTC as unknown) as CompletedProtocolAnalysis
const mockAdapterDef = fixture_adapter as LabwareDefinition2
const mockAdapterId = 'mockAdapterId'
const TCModelInProtocol = 'thermocyclerModuleV1'
const MOCK_SLOT = '2'
const TCIdInProtocol =
  '18f0c1b0-0122-11ec-88a3-f1745cf9b36c:thermocyclerModuleType' // this is just taken from the protocol fixture

const mockGetLabwareLocation = getLabwareLocation as jest.MockedFunction<
  typeof getLabwareLocation
>
const mockGetModuleInitialLoadInfo = getModuleInitialLoadInfo as jest.MockedFunction<
  typeof getModuleInitialLoadInfo
>

describe('getLabwareOffsetLocation', () => {
  let MOCK_LABWARE_ID: string
  let MOCK_COMMANDS: CompletedProtocolAnalysis['commands']
  let MOCK_MODULES: LoadedModule[]
  let MOCK_LABWARE: LoadedLabware[]
  beforeEach(() => {
    MOCK_LABWARE_ID = 'some_labware'
    MOCK_COMMANDS = protocolWithTC.commands
    MOCK_MODULES = [
      {
        id: TCIdInProtocol,
        model: 'thermocyclerModuleV1',
      },
    ] as LoadedModule[]
    MOCK_LABWARE = [
      {
        id: mockAdapterId,
        loadName: mockAdapterDef.parameters.loadName,
        definitionUri: getLabwareDefURI(mockAdapterDef),
        location: { moduleId: TCIdInProtocol },
        displayName: 'adapter nickname',
      },
    ]
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should return just the slot name if the labware is not on top of a module or adapter', () => {
    const MOCK_SLOT = '2'
    when(mockGetLabwareLocation)
      .calledWith(MOCK_LABWARE_ID, MOCK_COMMANDS)
      .mockReturnValue({ slotName: MOCK_SLOT })

    expect(
      getLabwareOffsetLocation(MOCK_LABWARE_ID, MOCK_COMMANDS, MOCK_MODULES, [])
    ).toEqual({ slotName: MOCK_SLOT })
  })
  it('should return null if the location is off deck', () => {
    when(mockGetLabwareLocation)
      .calledWith(MOCK_LABWARE_ID, MOCK_COMMANDS)
      .mockReturnValue('offDeck')

    expect(
      getLabwareOffsetLocation(MOCK_LABWARE_ID, MOCK_COMMANDS, MOCK_MODULES, [])
    ).toEqual(null)
  })
  it('should return the slot name and module model if the labware is on top of a module', () => {
    when(mockGetLabwareLocation)
      .calledWith(MOCK_LABWARE_ID, MOCK_COMMANDS)
      .mockReturnValue({ moduleId: TCIdInProtocol })
    when(mockGetModuleInitialLoadInfo)
      .calledWith(TCIdInProtocol, MOCK_COMMANDS)
      .mockReturnValue({ location: { slotName: MOCK_SLOT } } as any)

    expect(
      getLabwareOffsetLocation(MOCK_LABWARE_ID, MOCK_COMMANDS, MOCK_MODULES, [])
    ).toEqual({ slotName: MOCK_SLOT, moduleModel: TCModelInProtocol })
  })

  it('should return the slot name, module model and definition uri for labware on adapter on mod', () => {
    mockGetLabwareLocation.mockReturnValue({ labwareId: mockAdapterId })
    mockGetModuleInitialLoadInfo.mockReturnValue({
      location: { slotName: MOCK_SLOT },
    } as any)
    expect(
      getLabwareOffsetLocation(
        MOCK_LABWARE_ID,
        MOCK_COMMANDS,
        MOCK_MODULES,
        MOCK_LABWARE
      )
    ).toEqual({
      slotName: MOCK_SLOT,
      moduleModel: TCModelInProtocol,
      definitionUri: getLabwareDefURI(mockAdapterDef),
    })
  })

  it('should return the slot name and definition uri for labware on adapter on deck', () => {
    MOCK_LABWARE = [
      {
        id: mockAdapterId,
        loadName: mockAdapterDef.parameters.loadName,
        definitionUri: getLabwareDefURI(mockAdapterDef),
        location: { slotName: MOCK_SLOT },
        displayName: 'adapter nickname',
      },
    ]
    MOCK_MODULES = []
    mockGetLabwareLocation.mockReturnValue({ labwareId: mockAdapterId })
    expect(
      getLabwareOffsetLocation(
        MOCK_LABWARE_ID,
        MOCK_COMMANDS,
        MOCK_MODULES,
        MOCK_LABWARE
      )
    ).toEqual({
      slotName: MOCK_SLOT,
      definitionUri: getLabwareDefURI(mockAdapterDef),
    })
  })
})
