import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  BORDERS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { Banner } from '../../../atoms/Banner'
import { NoParameter } from './NoParameter'

import type { RunTimeParameter } from '@opentrons/shared-data'

interface ProtocolParametersProps {
  runTimeParameters: RunTimeParameter[]
}

export function ProtocolParameters({
  runTimeParameters,
}: ProtocolParametersProps): JSX.Element {
  const { t } = useTranslation('protocol_details')

  return (
    <Flex>
      {runTimeParameters.length > 0 ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          width="100%"
        >
          <Banner
            type="informing"
            width="100%"
            iconMarginLeft={SPACING.spacing4}
          >
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
        return Boolean(defaultValue) ? t('on') : t('off')
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

  const formatRange = (
    runTimeParameter: RunTimeParameter,
    minMax: string
  ): string => {
    const { type } = runTimeParameter
    const choices =
      'choices' in runTimeParameter ? runTimeParameter.choices : []
    const count = choices.length

    switch (type) {
      case 'int':
      case 'float':
        return minMax
      case 'boolean':
        return t('on_off')
      case 'str':
        if (count > 2) {
          return t('choices', { count })
        } else {
          return choices.map(choice => choice.displayName).join(', ')
        }
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
        {runTimeParameters.map((parameter: RunTimeParameter, index: number) => {
          const min = 'min' in parameter ? parameter.min : 0
          const max = 'max' in parameter ? parameter.max : 0
          return (
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
                <StyledText as="p">
                  {formatRange(parameter, `${min}-${max}`)}
                </StyledText>
              </StyledTableCell>
            </StyledTableRow>
          )
        })}
      </tbody>
    </StyledTable>
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
