// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react-remove-scroll'
import { Flex } from '../../primitives'
import { SPACING } from '../../ui-style-constants'
import { ParametersTable } from './index'

import type { Meta, StoryObj } from '@storybook/react'
import type { RunTimeParameter } from '@opentrons/shared-data'

const runTimeParameters: RunTimeParameter[] = [
  {
    value: false,
    displayName: 'Dry Run',
    variableName: 'DRYRUN',
    description: 'Is this a dry or wet run? Wet is true, dry is false',
    type: 'bool',
    default: false,
  },
  {
    value: true,
    displayName: 'Use Gripper',
    variableName: 'USE_GRIPPER',
    description: 'For using the gripper.',
    type: 'bool',
    default: true,
  },
  {
    value: true,
    displayName: 'Trash Tips',
    variableName: 'TIP_TRASH',
    description:
      'to throw tip into the trash or to not throw tip into the trash',
    type: 'bool',
    default: true,
  },
  {
    value: true,
    displayName: 'Deactivate Temperatures',
    variableName: 'DEACTIVATE_TEMP',
    description: 'deactivate temperature on the module',
    type: 'bool',
    default: true,
  },
  {
    value: 4,
    displayName: 'Columns of Samples',
    variableName: 'COLUMNS',
    description: 'How many columns do you want?',
    type: 'int',
    min: 1,
    max: 14,
    default: 4,
  },
  {
    value: 6,
    displayName: 'PCR Cycles',
    variableName: 'PCR_CYCLES',
    description: 'number of PCR cycles on a thermocycler',
    type: 'int',
    min: 1,
    max: 10,
    default: 6,
  },
  {
    value: 6.5,
    displayName: 'EtoH Volume',
    variableName: 'ETOH_VOLUME',
    description: '70% ethanol volume',
    type: 'float',
    suffix: 'mL',
    min: 1.5,
    max: 10.0,
    default: 6.5,
  },
  {
    value: 'none',
    displayName: 'Default Module Offsets',
    variableName: 'DEFAULT_OFFSETS',
    description: 'default module offsets for temp, H-S, and none',
    type: 'str',
    choices: [
      {
        displayName: 'No offsets',
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
    value: 'left',
    displayName: 'pipette mount',
    variableName: 'mont',
    description: 'pipette mount',
    type: 'str',
    choices: [
      {
        displayName: 'Left',
        value: 'left',
      },
      {
        displayName: 'Right',
        value: 'right',
      },
    ],
    default: 'left',
  },
  {
    value: 'flex',
    displayName: 'short test case',
    variableName: 'short 2 options',
    description: 'this play 2 short options',
    type: 'str',
    choices: [
      {
        displayName: 'OT-2',
        value: 'ot2',
      },
      {
        displayName: 'Flex',
        value: 'flex',
      },
    ],
    default: 'flex',
  },
  {
    value: 'flex',
    displayName: 'long test case',
    variableName: 'long 2 options',
    description: 'this play 2 long options',
    type: 'str',
    choices: [
      {
        displayName: 'I am kind of long text version',
        value: 'ot2',
      },
      {
        displayName: 'I am kind of long text version. Today is 3/15',
        value: 'flex',
      },
    ],
    default: 'flex',
  },
]

const meta: Meta<typeof ParametersTable> = {
  title: 'Library/Molecules/ParametersTable',
  component: ParametersTable,
  decorators: [
    Story => (
      <Flex padding={SPACING.spacing16}>
        <Story />
      </Flex>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof ParametersTable>

export const DefaultParameterTable: Story = {
  args: {
    runTimeParameters: runTimeParameters,
  },
}
