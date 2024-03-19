import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'
import { Divider } from '../../../atoms/structure'
// import { Chip } from '../../../atoms/Chip'
import { NoParameter } from '../../ProtocolDetails/ProtocolParameters/NoParameter'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'

import type { RunTimeParameter } from '@opentrons/shared-data'

const mockData: RunTimeParameter[] = [
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

interface ProtocolRunRuntimeParametersProps {
  runId: string
}
export function ProtocolRunRuntimeParameters({
  runId,
}: ProtocolRunRuntimeParametersProps): JSX.Element {
  const { i18n, t } = useTranslation('protocol_setup')
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  // ToDo (kk:03/18/2024) mockData will be replaced with []
  const runTimeParameters = mostRecentAnalysis?.runTimeParameters ?? mockData
  const hasParameter = runTimeParameters.length > 0

  const formattedValue = (runTimeParameter: RunTimeParameter): string => {
    const { type, default: defaultValue } = runTimeParameter
    const suffix =
      'suffix' in runTimeParameter && runTimeParameter.suffix != null
        ? runTimeParameter.suffix
        : ''
    switch (type) {
      case 'int':
      case 'float':
        return `${defaultValue.toString()} ${suffix}`
      case 'boolean':
        return Boolean(defaultValue)
          ? i18n.format(t('on'), 'capitalize')
          : i18n.format(t('off'), 'capitalize')
      case 'str':
        if ('choices' in runTimeParameter && runTimeParameter.choices != null) {
          const choice = runTimeParameter.choices.find(
            choice => choice.value === defaultValue
          )
          if (choice != null) {
            return choice.displayName
          }
        }
        break
    }
    return ''
  }

  // ToDo (kk:03/19/2024) this will be replaced with the boolean from values check result
  const dummyBoolean = true

  // ToDO (kk:03/18/2024) Need to add Chip to updated runTime parameter value
  // This part will be implemented in a following PR since need to runTime parameter slideout
  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing16}
        gridGap={SPACING.spacing10}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_CENTER}
        >
          <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('parameters')}
          </StyledText>
          {hasParameter ? (
            <StyledText as="label" color={COLORS.grey60}>
              {dummyBoolean ? t('custom_values') : t('default_values')}
            </StyledText>
          ) : null}
        </Flex>
        {hasParameter ? (
          <Banner
            type="informing"
            width="100%"
            iconMarginLeft={SPACING.spacing4}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {t('values_are_view_only')}
              </StyledText>
              <StyledText as="p">{t('cancel_and_restart_to_edit')}</StyledText>
            </Flex>
          </Banner>
        ) : null}
      </Flex>
      {!hasParameter ? (
        <Flex padding={SPACING.spacing16}>
          <NoParameter />
        </Flex>
      ) : (
        <>
          <Divider width="100%" />
          <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing16}>
            <StyledTable>
              <thead>
                <StyledTableHeader>{t('name')}</StyledTableHeader>
                <StyledTableHeader>{t('value')}</StyledTableHeader>
              </thead>
              <tbody>
                {runTimeParameters.map(
                  (parameter: RunTimeParameter, index: number) => {
                    return (
                      <StyledTableRow
                        isLast={index === runTimeParameters.length - 1}
                        key={`runTimeParameter-${index}`}
                      >
                        <StyledTableCell
                          isLast={index === runTimeParameters.length - 1}
                        >
                          <StyledText as="p">
                            {parameter.displayName}
                          </StyledText>
                        </StyledTableCell>
                        <StyledTableCell
                          isLast={index === runTimeParameters.length - 1}
                        >
                          <Flex
                            flexDirection={DIRECTION_ROW}
                            gridGap={SPACING.spacing16}
                          >
                            <StyledText as="p">
                              {formattedValue(parameter)}
                            </StyledText>
                            {/* ToDo (kk:03/19/2024) chip will be here with conditional render */}
                            {/* {index % 2 === 0 ? (
                              <Chip text={t('updated')} type="success" />
                            ) : null} */}
                          </Flex>
                        </StyledTableCell>
                      </StyledTableRow>
                    )
                  }
                )}
              </tbody>
            </StyledTable>
          </Flex>
        </>
      )}
    </>
  )
}

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`

const StyledTableHeader = styled.th`
  ${TYPOGRAPHY.labelSemiBold}
  padding: ${SPACING.spacing8};
  border-bottom: ${BORDERS.lineBorder};
`

interface StyledTableRowProps {
  isLast: boolean
}

const StyledTableRow = styled.tr<StyledTableRowProps>`
  padding: ${SPACING.spacing8};
  border-bottom: ${props => (props.isLast ? 'none' : BORDERS.lineBorder)};
`

interface StyledTableCellProps {
  isLast: boolean
}

const StyledTableCell = styled.td<StyledTableCellProps>`
  padding-left: ${SPACING.spacing8};
  padding-top: ${SPACING.spacing12};
  padding-bottom: ${props => (props.isLast ? 0 : SPACING.spacing12)};
`
