import * as React from 'react'
import styled from 'styled-components'
import { formatRunTimeParameterValue } from '@opentrons/shared-data'
import { BORDERS } from '../../helix-design-system'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants/index'
import { StyledText } from '../../atoms/StyledText'

import type { RunTimeParameter } from '@opentrons/shared-data'

interface ProtocolParameterItemsProps {
  runTimeParameters: RunTimeParameter[]
  t?: any
}

/** used in both the desktop app and Protocol Library
 * to display the run time parameters table
 */
export function ParametersTable({
  runTimeParameters,
  t,
}: ProtocolParameterItemsProps): JSX.Element {
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
        return t != null ? t('on_off') : 'On, off'
      case 'str':
        if (count > 2) {
          return t != null ? t('choices', { count }) : `${count} choices`
        } else {
          return choices.map(choice => choice.displayName).join(', ')
        }
    }
    return ''
  }

  return (
    <StyledTable>
      <thead>
        <StyledTableHeader>{t != null ? t('name') : 'Name'}</StyledTableHeader>
        <StyledTableHeader>
          {t != null ? t('default_value') : 'Default Value'}
        </StyledTableHeader>
        <StyledTableHeader>
          {t != null ? t('range') : 'Range'}
        </StyledTableHeader>
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
                <StyledText as="p">
                  {formatRunTimeParameterValue(parameter, t)}
                </StyledText>
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
