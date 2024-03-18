import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { NoParameter } from '../../ProtocolDetails/ProtocolParameters/NoParameter'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

import { RunTimeParameter } from '@opentrons/shared-data'

const mockData: RunTimeParameter[] = [
  {
    displayName: 'Dry Run',
    variableName: 'DRYRUN',
    description: 'Is this a dry or wet run? Wet is true, dry is false',
    type: 'boolean',
    default: false,
  },
  {
    displayName: 'Use Gripper',
    variableName: 'USE_GRIPPER',
    description: 'For using the gripper.',
    type: 'boolean',
    default: true,
  },
  {
    displayName: 'Trash Tips',
    variableName: 'TIP_TRASH',
    description:
      'to throw tip into the trash or to not throw tip into the trash',
    type: 'boolean',
    default: true,
  },
  {
    displayName: 'Deactivate Temperatures',
    variableName: 'DEACTIVATE_TEMP',
    description: 'deactivate temperature on the module',
    type: 'boolean',
    default: true,
  },
  {
    displayName: 'Columns of Samples',
    variableName: 'COLUMNS',
    description: 'How many columns do you want?',
    type: 'int',
    min: 1,
    max: 14,
    default: 4,
  },
  {
    displayName: 'PCR Cycles',
    variableName: 'PCR_CYCLES',
    description: 'number of PCR cycles on a thermocycler',
    type: 'int',
    min: 1,
    max: 10,
    default: 6,
  },
  {
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

interface ProtocolRunRuntimeParametersProps {
  runId: string
}
export function ProtocolRunRuntimeParameters({
  runId,
}: ProtocolRunRuntimeParametersProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const parameters = mostRecentAnalysis?.runTimeParameters ?? mockData
  const isNoParameter = parameters.length < 1
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex backgroundColor={COLORS.white} padding={SPACING.spacing16}>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_CENTER}
        >
          <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('parameters')}
          </StyledText>
          {!isNoParameter ? (
            <StyledText as="label" color={COLORS.grey60}>
              {t('default_values')}
            </StyledText>
          ) : null}
        </Flex>
      </Flex>
      <Flex backgroundColor={COLORS.white} padding={SPACING.spacing16}>
        {isNoParameter ? (
          <NoParameter />
        ) : (
          <StyledText>{'parameters'}</StyledText>
        )}
      </Flex>
    </Flex>
  )
}
