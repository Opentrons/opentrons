import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  BORDERS,
  COLORS,
  Flex,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { useToaster } from '../../organisms/ToasterOven'
import { useRunTimeParameters } from '../Protocols/hooks'
import { EmptySection } from './EmptySection'
import type { RunTimeParameter } from '@opentrons/shared-data'

const Table = styled('table')`
  font-size: ${TYPOGRAPHY.fontSize22};
  width: 100%;
  border-spacing: 0 ${SPACING.spacing8};
  margin: ${SPACING.spacing16} 0;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  font-size: ${TYPOGRAPHY.fontSize20};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  padding: ${SPACING.spacing4};
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

  const getRange = (parameter: RunTimeParameter): string => {
    const { type } = parameter
    const min = 'min' in parameter ? parameter.min : 0
    const max = 'max' in parameter ? parameter.max : 0
    const numChoices = 'choices' in parameter ? parameter.choices.length : 0
    let range: string | null = null
    if (numChoices === 2 && 'choices' in parameter) {
      range = `${parameter.choices[0].displayName}, ${parameter.choices[1].displayName}`
    }

    switch (type) {
      case 'boolean': {
        return t('on_off')
      }
      case 'float':
      case 'int': {
        return `${min}-${max}`
      }
      case 'str': {
        return range ?? t('num_choices', { num: numChoices })
      }
      default:
        //  Should never hit this case
        return ''
    }
  }

  const getDefault = (parameter: RunTimeParameter): string => {
    const { type, default: defaultValue } = parameter
    const suffix =
      'suffix' in parameter && parameter.suffix != null ? parameter.suffix : ''
    switch (type) {
      case 'int':
      case 'float':
        return `${defaultValue.toString()} ${suffix}`
      case 'boolean':
        return Boolean(defaultValue) ? t('on') : t('off')
      case 'str':
        if ('choices' in parameter && parameter.choices != null) {
          const choice = parameter.choices.find(
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
        {runTimeParameters.map((parameter, index) => {
          return (
            <TableRow key={index}>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24}>
                  {parameter.displayName}
                </Flex>
              </TableDatum>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24} color={COLORS.grey60}>
                  {getDefault(parameter)}
                </Flex>
              </TableDatum>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24} color={COLORS.grey60}>
                  {getRange(parameter)}
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
