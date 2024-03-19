import type { RunTimeParameter } from '@opentrons/shared-data'

export const mockRunTimeParameterData: RunTimeParameter[] = [
  {
    displayName: 'Dry Run',
    variableName: 'DRYRUN',
    description: 'a dry run description',
    type: 'boolean',
    default: false,
  },
  {
    displayName: 'Use Gripper',
    variableName: 'USE_GRIPPER',
    description: '',
    type: 'boolean',
    default: true,
  },
  {
    displayName: 'Trash Tips',
    variableName: 'TIP_TRASH',
    description: 'throw tip in trash',
    type: 'boolean',
    default: true,
  },
  {
    displayName: 'Deactivate Temperatures',
    variableName: 'DEACTIVATE_TEMP',
    description: 'deactivate temperature?',
    type: 'boolean',
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
  {
    displayName: '2 choices',
    variableName: 'TWO',
    description: '',
    type: 'str',
    choices: [
      {
        displayName: 'one choice',
        value: '1',
      },
      {
        displayName: 'the second',
        value: '2',
      },
    ],
    default: '2',
  },
]
