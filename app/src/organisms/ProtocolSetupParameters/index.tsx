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

  // todo (nd:04/01/2024): remove mock and look at runTimeParameters prop
  // const parameters = runTimeParameters ?? []
  const parameters = runTimeParameters ?? mockData
  const [
    runTimeParametersOverrides,
    setRunTimeParametersOverrides,
  ] = React.useState<RunTimeParameter[]>(parameters)
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
        <ResetValuesModal
          runTimeParametersOverrides={runTimeParametersOverrides}
          setRunTimeParametersOverrides={setRunTimeParametersOverrides}
          handleGoBack={() => showResetValuesModal(false)}
        />
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
        paddingX={SPACING.spacing40}
        paddingBottom={SPACING.spacing40}
      >
        {runTimeParametersOverrides.map((parameter, index) => {
          if ('choices' in parameter) {
            return (
              <React.Fragment key={`${parameter.displayName}_${index}`}>
                <ProtocolSetupStep
                  hasIcon={true}
                  status="general"
                  title={parameter.displayName}
                  onClickSetupStep={() => {
                    // todo (nd:04/01/2023) add screens for number and enumeration inputs
                  }}
                  detail={parameter.value.toString()}
                  description={parameter.description}
                  fontSize="h4"
                />
              </React.Fragment>
            )
          } else if (parameter.type === 'boolean') {
            return (
              <React.Fragment key={`${parameter.displayName}_${index}`}>
                <ProtocolSetupStep
                  hasIcon={false}
                  status="general"
                  title={parameter.displayName}
                  onClickSetupStep={() => {
                    // todo (nd:04/01/2023) add screens for number and enumeration inputs
                    const clone = runTimeParametersOverrides.map((param, i) => {
                      if (i === index) {
                        return {
                          ...param,
                          value: !param.value,
                        }
                      }
                      return param
                    })
                    setRunTimeParametersOverrides(clone)
                  }}
                  detail={parameter.value ? t('on') : t('off')}
                  description={parameter.description}
                  fontSize="h4"
                />
              </React.Fragment>
            )
          } else if (parameter.type === 'int' || parameter.type === 'float') {
            return (
              <React.Fragment key={`${parameter.displayName}_${index}`}>
                <ProtocolSetupStep
                  hasIcon={true}
                  status="general"
                  title={parameter.displayName}
                  onClickSetupStep={() => {
                    // todo (nd:04/01/2023) add screens for number and enumeration inputs
                  }}
                  detail={parameter.value.toString()}
                  description={parameter.description}
                  fontSize="h4"
                />
              </React.Fragment>
            )
          }
        })}
      </Flex>
    </>
  )
}
