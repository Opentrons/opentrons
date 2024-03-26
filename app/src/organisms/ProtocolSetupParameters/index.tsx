import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useCreateRunMutation, useHost } from '@opentrons/react-api-client'
import { useQueryClient } from 'react-query'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'

import { ProtocolSetupStep } from '../../pages/ProtocolSetup'
import { ChildNavigation } from '../ChildNavigation'
import { ResetValuesModal } from './ResetValuesModal'
import { formatRunTimeParameterValue } from '../ProtocolDetails/ProtocolParameters/utils'

import type { RunTimeParameter } from '@opentrons/shared-data'
import type { LabwareOffsetCreateData } from '@opentrons/api-client'

export const mockData: RunTimeParameter[] = [
  {
    value: false,
    displayName: 'Dry Run',
    variableName: 'DRYRUN',
    description: 'Is this a dry or wet run? Wet is true, dry is false',
    type: 'boolean',
    default: false,
  },
  {
    value: true,
    displayName: 'Use Gripper',
    variableName: 'USE_GRIPPER',
    description: 'For using the gripper.',
    type: 'boolean',
    default: true,
  },
  {
    value: true,
    displayName: 'Trash Tips',
    variableName: 'TIP_TRASH',
    description:
      'to throw tip into the trash or to not throw tip into the trash',
    type: 'boolean',
    default: true,
  },
  {
    value: true,
    displayName: 'Deactivate Temperatures',
    variableName: 'DEACTIVATE_TEMP',
    description: 'deactivate temperature on the module',
    type: 'boolean',
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

interface ProtocolSetupParametersProps {
  protocolId: string
  runTimeParameters?: RunTimeParameter[]
  labwareOffsets?: LabwareOffsetCreateData[]
}

export function ProtocolSetupParameters({
  protocolId,
  labwareOffsets,
  runTimeParameters,
}: ProtocolSetupParametersProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const history = useHistory()
  const host = useHost()
  const queryClient = useQueryClient()
  const [resetValuesModal, showResetValuesModal] = React.useState<boolean>(
    false
  )
  const parameters = runTimeParameters ?? []
  //    TODO(jr, 3/20/24): modify useCreateRunMutation to take in optional run time parameters
  const { createRun, isLoading } = useCreateRunMutation({
    onSuccess: data => {
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`could not invalidate runs cache: ${e.message}`)
        )
    },
  })
  const handleConfirmValues = (): void => {
    createRun({ protocolId, labwareOffsets })
  }

  return (
    <>
      {resetValuesModal ? (
        <ResetValuesModal handleGoBack={() => showResetValuesModal(false)} />
      ) : null}

      <ChildNavigation
        header={t('parameters')}
        onClickBack={() => history.goBack()}
        onClickButton={handleConfirmValues}
        buttonText={t('confirm_values')}
        iconName={isLoading ? 'ot-spinner' : undefined}
        iconPlacement="startIcon"
        secondaryButtonProps={{
          buttonType: 'tertiaryLowLight',
          buttonText: t('restore_default'),
          onClick: () => showResetValuesModal(true),
        }}
      />
      <Flex
        marginTop="7.75rem"
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing8}
      >
        {parameters.map((parameter, index) => {
          return (
            <React.Fragment key={`${parameter.displayName}_${index}`}>
              <ProtocolSetupStep
                hasIcon={!(parameter.type === 'boolean')}
                status="general"
                title={parameter.displayName}
                onClickSetupStep={() => console.log('TODO: wire this up')}
                detail={formatRunTimeParameterValue(parameter, t)}
                description={parameter.description}
                fontSize="h4"
              />
            </React.Fragment>
          )
        })}
      </Flex>
    </>
  )
}
