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
import type { RunTimeParameters } from '@opentrons/shared-data'

interface RangeProps {
  type: RunTimeParameters['type']
  max: number
  min: number
}
interface DefaultProps {
  default: unknown
  suffix?: string
}

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

  const getRange = (props: RangeProps): string => {
    switch (props.type) {
      case 'boolean': {
        return t('on_off')
      }
      case 'float':
      case 'int': {
        return `${props.min}-${props.max}`
      }
      case 'str': {
        return t('multi')
      }
    }
  }

  const getDefault = (props: DefaultProps): string => {
    if (props.suffix != null) {
      return `${props.default} ${props.suffix}`
    } else if (props.default === false) {
      return t('off')
    } else if (props.default === true) {
      return t('on')
    } else {
      return `${props.default}`
    }
  }

  return runTimeParameters.length === 0 ? (
    <EmptySection section="parameters" />
  ) : (
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
          const min = 'min' in parameter ? parameter.min : 0
          const max = 'max' in parameter ? parameter.max : 0
          return (
            <TableRow key={index}>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24}>
                  {parameter.displayName}
                </Flex>
              </TableDatum>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24} color={COLORS.grey60}>
                  {getDefault({
                    default: parameter.default,
                    suffix: parameter.suffix,
                  })}
                </Flex>
              </TableDatum>
              <TableDatum>
                <Flex paddingLeft={SPACING.spacing24} color={COLORS.grey60}>
                  {getRange({ type: parameter.type, max, min })}
                </Flex>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
