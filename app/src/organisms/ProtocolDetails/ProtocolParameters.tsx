import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

// Note (03/13/2024: kk) this will be replaced with custom hooks return
import exampleRunTimeParameters from './exampleRunTimeParameters.json'

// Note (03/13/2024: kk) probably the following if/type will be moved more better place later
interface Choice {
  displayName: string
  value: string
}

type DefaultValueType = string | number | boolean

interface RunTimeParameter {
  displayName: string
  variableName: string
  description: string
  suffix: string | null
  min?: number
  max?: number
  choices?: Choice[]
  default: DefaultValueType
}

interface ProtocolParametersProps {
  analysis: ProtocolAnalysisOutput | null
}

export function ProtocolParameters({
  analysis,
}: ProtocolParametersProps): JSX.Element {
  const { t } = useTranslation('protocol_details')

  // ToDo (03/13/2024:kk) the sample data will be replaces analysis data
  const isUsingSampleData = true
  const { runTimeParameters } = isUsingSampleData
    ? exampleRunTimeParameters
    : { runTimeParameters: [] }

  return (
    <Flex>
      {runTimeParameters.length > 0 ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          width="100%"
        >
          <Banner type="informing" width="100%">
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {t('listed_values_are_view_only')}
              </StyledText>
              <StyledText as="p">
                {t('start_setup_customize_values')}
              </StyledText>
            </Flex>
          </Banner>
          <ProtocolParameterItems runTimeParameters={runTimeParameters} />
        </Flex>
      ) : (
        <NoParameter />
      )}
    </Flex>
  )
}

interface ProtocolParameterItemsProps {
  runTimeParameters: RunTimeParameter[]
}

function ProtocolParameterItems({
  runTimeParameters,
}: ProtocolParameterItemsProps): JSX.Element {
  const { t } = useTranslation('protocol_details')

  const formattedValue = (parameter: RunTimeParameter): string => {
    if (typeof parameter.default === 'boolean') {
      return parameter.default ? 'On' : 'Off'
    }

    if (typeof parameter.default === 'number') {
      return parameter.default.toString()
    }

    if (parameter.choices != null) {
      const choice = parameter.choices.find(
        choice => choice.value === parameter.default
      )
      if (choice != null) {
        return choice.displayName
      }
    }
    return ''
  }

  const formatRange = (obj: RunTimeParameter): string => {
    if (
      Object.prototype.hasOwnProperty.call(obj, 'min') &&
      Object.prototype.hasOwnProperty.call(obj, 'max')
    ) {
      return `${obj.min}-${obj.max}`
    }
    if (typeof obj.default === 'boolean') {
      return 'On, off'
    }
    if (Object.prototype.hasOwnProperty.call(obj, 'choices')) {
      return 'Multi'
    }
    return ''
  }

  return (
    <StyledTable>
      <thead>
        <StyledTableHeader>{t('name')}</StyledTableHeader>
        <StyledTableHeader>{t('default_value')}</StyledTableHeader>
        <StyledTableHeader>{t('range')}</StyledTableHeader>
      </thead>
      <tbody>
        {runTimeParameters.map((parameter: RunTimeParameter, index: number) => (
          <StyledTableRow
            isLast={index === runTimeParameters.length - 1}
            key={`runTimeParameter-${index}`}
          >
            <StyledTableCell isLast={index === runTimeParameters.length - 1}>
              <StyledText as="p">{parameter.displayName}</StyledText>
            </StyledTableCell>
            <StyledTableCell isLast={index === runTimeParameters.length - 1}>
              <StyledText as="p">{formattedValue(parameter)}</StyledText>
            </StyledTableCell>
            <StyledTableCell isLast={index === runTimeParameters.length - 1}>
              <StyledText as="p">{formatRange(parameter)}</StyledText>
            </StyledTableCell>
          </StyledTableRow>
        ))}
      </tbody>
    </StyledTable>
  )
}

function NoParameter(): JSX.Element {
  const { t } = useTranslation('protocol_details')

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      backgroundColor={COLORS.grey30}
      borderRadius={BORDERS.borderRadiusSize2}
      padding={`${SPACING.spacing40} ${SPACING.spacing16}`}
    >
      <Icon name="ot-alert" size="1.25rem" color={COLORS.grey60} />
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('no_parameters')}
      </StyledText>
    </Flex>
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
