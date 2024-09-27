import { fixtureTiprack300ul } from '@opentrons/shared-data'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export const PROTOCOL_ID = 'fake_protocol_id'
export const MOCK_RTP_DATA = [
  {
    displayName: 'Dry Run',
    variableName: 'DRYRUN',
    description: 'a dry run description',
    type: 'bool',
    default: false,
  },
  {
    displayName: 'Use Gripper',
    variableName: 'USE_GRIPPER',
    description: '',
    type: 'bool',
    default: true,
  },
  {
    displayName: 'Trash Tips',
    variableName: 'TIP_TRASH',
    description: 'throw tip in trash',
    type: 'bool',
    default: true,
  },
  {
    displayName: 'Deactivate Temperatures',
    variableName: 'DEACTIVATE_TEMP',
    description: 'deactivate temperature?',
    type: 'bool',
    default: true,
  },
  {
    displayName: 'Columns of Samples',
    variableName: 'COLUMNS',
    description: '',
    suffix: 'mL',
    type: 'int',
    min: 1,
    max: 14,
    default: 4,
  },
  {
    displayName: 'PCR Cycles',
    variableName: 'PCR_CYCLES',
    description: '',
    type: 'int',
    min: 1,
    max: 10,
    default: 6,
  },
  {
    displayName: 'EtoH Volume',
    variableName: 'ETOH_VOLUME',
    description: '',
    type: 'float',
    min: 1.5,
    max: 10.0,
    default: 6.5,
  },
  {
    displayName: 'Default Module Offsets',
    variableName: 'DEFAULT_OFFSETS',
    description: '',
    type: 'str',
    choices: [
      {
        displayName: 'no offsets',
        value: 'none',
      },
      {
        displayName: 'temp offset',
        value: '1',
      },
      {
        displayName: 'heater-shaker offset',
        value: '2',
      },
    ],
    default: 'none',
  },
]
export const mockLabwareDef = fixtureTiprack300ul as LabwareDefinition2
export const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
  pipettes: [{ id: 'pipId', pipetteName: 'p1000_multi_flex', mount: 'left' }],
  modules: [
    {
      id: 'modId',
      model: 'heaterShakerModuleV1',
      location: { slotName: 'D3' },
      serialNumber: 'serialNum',
    },
  ],
  commands: [
    {
      key: 'CommandKey0',
      commandType: 'loadModule',
      params: {
        model: 'heaterShakerModuleV1',
        location: { slotName: 'D3' },
      },
      result: {
        moduleId: 'modId',
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
        labwareId: 'firstLabwareId',
        location: { moduleId: 'modId' },
        displayName: 'first labware nickname',
      },
      result: {
        labwareId: 'firstLabwareId',
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
  ],
  runTimeParameters: MOCK_RTP_DATA,
} as any

export const NULL_COMMAND = {
  id: '97ba49a5-04f6-4f91-986a-04a0eb632882',
  createdAt: '2022-09-07T19:47:42.781065+00:00',
  commandType: 'loadPipette',
  key: '0feeecaf-3895-46d7-ab71-564601265e35',
  status: 'succeeded',
  params: {
    pipetteName: 'p20_single_gen2',
    mount: 'left',
    pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
  },
  result: {
    pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
  },
  startedAt: '2022-09-07T19:47:42.782665+00:00',
  completedAt: '2022-09-07T19:47:42.785061+00:00',
}

export const NULL_PROTOCOL_ANALYSIS = {
  ...PROTOCOL_ANALYSIS,
  id: 'null_analysis',
  commands: [NULL_COMMAND],
} as any
