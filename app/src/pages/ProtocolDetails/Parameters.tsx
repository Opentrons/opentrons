import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  formatRunTimeParameterDefaultValue,
  formatRunTimeParameterMinMax,
  orderRuntimeParameterRangeOptions,
  sortRuntimeParameters,
} from '@opentrons/shared-data'
import {
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { useToaster } from '../../organisms/ToasterOven'
import { useRunTimeParameters } from '../Protocols/hooks'
import { EmptySection } from './EmptySection'
import type { RunTimeParameter } from '@opentrons/shared-data'

const Table = styled('table')`
  font-size: ${TYPOGRAPHY.fontSize22};
  width: 100%;
  border-spacing: 0 ${SPACING.spacing8};
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  font-size: ${TYPOGRAPHY.fontSize20};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  padding: 0 ${SPACING.spacing4} 0 ${SPACING.spacing4};
  color: ${COLORS.grey60};
`

const TableRow = styled('tr')`
  background-color: ${COLORS.grey35};
  border: 1px ${COLORS.white} solid;
  height: 4.75rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing4};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.borderRadius4};
    border-bottom-left-radius: ${BORDERS.borderRadius4};
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.borderRadius4};
    border-bottom-right-radius: ${BORDERS.borderRadius4};
  }
`

export const Parameters = (props: { protocolId: string }): JSX.Element => {
  const runTimeParameters = useRunTimeParameters(props.protocolId)
  const { makeSnackbar } = useToaster()
  const { t, i18n } = useTranslation('protocol_details')

  const makeSnack = (): void => {
    makeSnackbar(t('start_setup_customize_values'))
  }

  const formatRange = (parameter: RunTimeParameter): string => {
    const { type } = parameter
    const numChoices = 'choices' in parameter ? parameter.choices.length : 0
    const minMax = formatRunTimeParameterMinMax(parameter)
    let range: string | null = null
    if (numChoices === 2 && 'choices' in parameter) {
      range = orderRuntimeParameterRangeOptions(parameter.choices)
    }

    switch (type) {
      case 'bool': {
        return t('on_off')
      }
      case 'float':
      case 'int': {
        return minMax
      }
      case 'str': {
        return range ?? t('num_choices', { num: numChoices })
      }
      case 'csv_file': {
        return t('n_a')
      }
      default:
        //  Should never hit this case
        return ''
    }
  }

  return runTimeParameters.length > 0 ? (
    <Table onClick={makeSnack} data-testid="Parameters_table">
      <thead>
        <tr>
          <TableHeader>
            <StyledText paddingLeft={SPACING.spacing24}>
              {i18n.format(t('name'), 'capitalize')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText paddingLeft={SPACING.spacing24}>
              {i18n.format(t('default_value'), 'capitalize')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText paddingLeft={SPACING.spacing24}>
              {i18n.format(t('range'), 'capitalize')}
            </StyledText>
          </TableHeader>
        </tr>
      </thead>
      <tbody>
        {sortRuntimeParameters(runTimeParameters).map((parameter, index) => {
          return (
            <TableRow key={index}>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24}>
                  {parameter.displayName}
                </Flex>
              </TableDatum>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24} color={COLORS.grey60}>
                  {parameter.type === 'csv_file'
                    ? t('file_required')
                    : formatRunTimeParameterDefaultValue(parameter, t)}
                </Flex>
              </TableDatum>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24} color={COLORS.grey60}>
                  {formatRange(parameter)}
                </Flex>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  ) : (
    <EmptySection section="parameters" />
  )
}
