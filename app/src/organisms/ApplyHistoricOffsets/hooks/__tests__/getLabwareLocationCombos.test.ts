import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'

import { getLabwareLocationCombos } from '../getLabwareLocationCombos'
import {
  getLabwareDefURI,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

import type { LabwareDefinition2, RunTimeCommand } from '@opentrons/shared-data'

const mockLabwareDef = fixture_tiprack_300_ul as LabwareDefinition2
const mockLoadLabwareCommands: RunTimeCommand[] = [
  {
    key: 'CommandKey0',
    commandType: 'loadLabware',
    params: {
      labwareId: 'firstLabwareId',
      location: { slotName: '1' },
      displayName: 'first labware nickname',
      version: 1,
      loadName: 'mockLoadname',
      namespace: 'mockNamespace',
    },
    result: {
      labwareId: 'firstLabwareId',
      definition: mockLabwareDef,
      offset: { x: 0, y: 0, z: 0 },
    },
    id: 'CommandId0',
    status: 'succeeded',
    error: null,
    createdAt: 'fakeCreatedAtTimestamp',
    startedAt: 'fakeStartedAtTimestamp',
    completedAt: 'fakeCompletedAtTimestamp',
  },
  {
    key: 'CommandKey1',
    commandType: 'loadLabware',
    params: {
      labwareId: 'secondLabwareId',
      location: { slotName: '2' },
      displayName: 'second labware nickname',
      version: 1,
      loadName: 'mockLoadname',
      namespace: 'mockNamespace',
    },
    result: {
      labwareId: 'secondLabwareId',
      definition: mockLabwareDef,
      offset: { x: 0, y: 0, z: 0 },
    },
    id: 'CommandId1',
    status: 'succeeded',
    error: null,
    createdAt: 'fakeCreatedAtTimestamp',
    startedAt: 'fakeStartedAtTimestamp',
    completedAt: 'fakeCompletedAtTimestamp',
  },
  {
    key: 'CommandKey2',
    commandType: 'loadLabware',
    params: {
      labwareId: 'duplicateLabwareId',
      location: { slotName: '2' },
      displayName: 'duplicate labware nickname',
      version: 1,
      loadName: 'mockLoadname',
      namespace: 'mockNamespace',
    },
    result: {
      labwareId: 'duplicateLabwareId',
      definition: mockLabwareDef,
      offset: { x: 0, y: 0, z: 0 },
    },
    id: 'CommandId2',
    status: 'succeeded',
    error: null,
    createdAt: 'fakeCreatedAtTimestamp',
    startedAt: 'fakeStartedAtTimestamp',
    completedAt: 'fakeCompletedAtTimestamp',
  },
  {
    key: 'CommandKey3',
    commandType: 'loadLabware',
    params: {
      labwareId: 'onModuleLabwareId',
      location: { moduleId: 'firstModuleId', slotName: '3' },
      displayName: 'duplicate labware nickname',
      version: 1,
      loadName: 'mockLoadname',
      namespace: 'mockNamespace',
    },
    result: {
      labwareId: 'onModuleLabwareId',
      definition: mockLabwareDef,
      offset: { x: 0, y: 0, z: 0 },
    },
    id: 'CommandId3',
    status: 'succeeded',
    error: null,
    createdAt: 'fakeCreatedAtTimestamp',
    startedAt: 'fakeStartedAtTimestamp',
    completedAt: 'fakeCompletedAtTimestamp',
  },
]

const mockLabwareEntities: ProtocolAnalysisOutput['labware'] = [
  {
    id: 'firstLabwareId',
    loadName: mockLabwareDef.parameters.loadName,
    definitionUri: getLabwareDefURI(mockLabwareDef),
    location: { slotName: '1' },
    displayName: 'first labware nickname',
  },
  {
    id: 'secondLabwareId',
    loadName: mockLabwareDef.parameters.loadName,
    definitionUri: getLabwareDefURI(mockLabwareDef),
    location: { slotName: '2' },
    displayName: 'second labware nickname',
  },
  {
    id: 'secondLabwareId',
    loadName: mockLabwareDef.parameters.loadName,
    definitionUri: getLabwareDefURI(mockLabwareDef),
    location: { slotName: '2' },
    displayName: 'second labware nickname',
  },
  {
    id: 'duplicateLabwareId',
    loadName: mockLabwareDef.parameters.loadName,
    definitionUri: getLabwareDefURI(mockLabwareDef),
    location: { slotName: '2' },
    displayName: 'duplicate labware nickname',
  },
  {
    id: 'onModuleLabwareId',
    loadName: mockLabwareDef.parameters.loadName,
    definitionUri: getLabwareDefURI(mockLabwareDef),
    location: { moduleId: 'firstModuleId', slotName: '3' },
    displayName: 'on module labware nickname',
  },
]

describe('getLabwareLocationCombos', () => {
  it('gets uniq labware locations from loadLabware commands', async () => {
    const commands: RunTimeCommand[] = mockLoadLabwareCommands

    const labware = mockLabwareEntities
    const modules: ProtocolAnalysisOutput['modules'] = [
      {
        id: 'firstModuleId',
        model: 'heaterShakerModuleV1',
        location: { slotName: '3' },
        serialNumber: 'firstModuleSerialNumber',
      },
    ]
    expect(getLabwareLocationCombos(commands, labware, modules)).toEqual([
      {
        location: { slotName: '1' },
        labwareId: 'firstLabwareId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
      {
        location: { slotName: '2' },
        labwareId: 'secondLabwareId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
      {
        location: { slotName: '2' },
        labwareId: 'duplicateLabwareId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
      {
        location: { slotName: '3', moduleModel: 'heaterShakerModuleV1' },
        labwareId: 'onModuleLabwareId',
        moduleId: 'firstModuleId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
    ])
  })

  it('gets uniq labware locations from moveLabware commands', async () => {
    const commands: RunTimeCommand[] = [
      ...mockLoadLabwareCommands,
      {
        key: 'CommandKey3',
        commandType: 'moveLabware',
        params: {
          labwareId: 'firstLabwareId',
          newLocation: { slotName: '4' },
          strategy: 'usingGripper',
        },
        result: { offsetId: 'fakeOffsetId' },
        id: 'CommandId3',
        status: 'succeeded',
        error: null,
        createdAt: 'fakeCreatedAtTimestamp',
        startedAt: 'fakeStartedAtTimestamp',
        completedAt: 'fakeCompletedAtTimestamp',
      },
      {
        key: 'CommandKey4',
        commandType: 'moveLabware',
        params: {
          labwareId: 'secondLabwareId',
          newLocation: { slotName: '5' },
          strategy: 'usingGripper',
        },
        result: { offsetId: 'fakeOffsetId' },
        id: 'CommandId4',
        status: 'succeeded',
        error: null,
        createdAt: 'fakeCreatedAtTimestamp',
        startedAt: 'fakeStartedAtTimestamp',
        completedAt: 'fakeCompletedAtTimestamp',
      },
      {
        key: 'CommandKey5',
        commandType: 'moveLabware',
        params: {
          labwareId: 'duplicateLabwareId',
          newLocation: { slotName: '5' },
          strategy: 'usingGripper',
        },
        result: { offsetId: 'fakeOffsetId' },
        id: 'CommandId5',
        status: 'succeeded',
        error: null,
        createdAt: 'fakeCreatedAtTimestamp',
        startedAt: 'fakeStartedAtTimestamp',
        completedAt: 'fakeCompletedAtTimestamp',
      },
    ]

    const labware: ProtocolAnalysisOutput['labware'] = [
      {
        id: 'firstLabwareId',
        loadName: mockLabwareDef.parameters.loadName,
        definitionUri: getLabwareDefURI(mockLabwareDef),
        location: { slotName: '1' },
        displayName: 'first labware nickname',
      },
      {
        id: 'secondLabwareId',
        loadName: mockLabwareDef.parameters.loadName,
        definitionUri: getLabwareDefURI(mockLabwareDef),
        location: { slotName: '2' },
        displayName: 'second labware nickname',
      },
      {
        id: 'duplicateLabwareId',
        loadName: mockLabwareDef.parameters.loadName,
        definitionUri: getLabwareDefURI(mockLabwareDef),
        location: { slotName: '2' },
        displayName: 'duplicate labware nickname',
      },
    ]
    const modules: ProtocolAnalysisOutput['modules'] = [
      {
        id: 'firstModuleId',
        model: 'heaterShakerModuleV1',
        location: { slotName: '3' },
        serialNumber: 'firstModuleSerialNumber',
      },
    ]
    expect(getLabwareLocationCombos(commands, labware, modules)).toEqual([
      {
        location: { slotName: '1' },
        labwareId: 'firstLabwareId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
      {
        location: { slotName: '2' },
        labwareId: 'secondLabwareId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
      {
        location: { slotName: '2' },
        labwareId: 'duplicateLabwareId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
      {
        location: { slotName: '3', moduleModel: 'heaterShakerModuleV1' },
        labwareId: 'onModuleLabwareId',
        moduleId: 'firstModuleId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
      {
        location: { slotName: '4' },
        labwareId: 'firstLabwareId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
      {
        location: { slotName: '5' },
        labwareId: 'secondLabwareId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
      {
        location: { slotName: '5' },
        labwareId: 'duplicateLabwareId',
        definitionUri: getLabwareDefURI(mockLabwareDef),
      },
    ])
  })
})
