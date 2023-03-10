import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import { StyledText } from '../../../atoms/text'
import { useRequiredProtocolLabware } from '../../Protocols/hooks'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  border-collapse: separate
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing2};
  margin: ${SPACING.spacing4} 0;
  text-align: left;
`
const TableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing2};
`

const TableRow = styled('tr')`
  border: 1px ${COLORS.white} solid;
  height: 4rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing2};
  white-space: break-spaces;
  text-overflow: wrap;
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  &:first-child {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
  }
  &:last-child {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }
`

export const Labware = (props: { protocolId: string }): JSX.Element => {
  const labwareItems = useRequiredProtocolLabware(props.protocolId)
  const labwareNames = labwareItems.map(li =>
    getLabwareDisplayName(li.definition)
  )

  const countedNames = labwareNames.reduce(
    (allNames: Record<string, number>, name: string) => {
      const currCount: number = allNames[name] ?? 0
      return {
        ...allNames,
        [name]: currCount + 1,
      }
    },
    {}
  )
  const { t } = useTranslation('protocol_setup')

  return (
    <Table>
      <thead>
        <tr>
          <TableHeader>{t('labware_name')}</TableHeader>
          <TableHeader
            style={{
              textAlign: 'center',
            }}
          >
            {t('quantity')}
          </TableHeader>
        </tr>
      </thead>
      <tbody>
        {Object.entries(countedNames).map(([name, count]) => {
          const definition = labwareItems.find(
            li => getLabwareDisplayName(li.definition) === name
          )?.definition
          return (
            <TableRow
              key={name}
              style={{
                backgroundColor: '#d6d6d6',
              }}
            >
              <TableDatum>
                <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
                  {definition?.namespace === 'opentrons' ? (
                    <Icon
                      color={COLORS.blueEnabled}
                      name="check-decagram"
                      height="0.75rem"
                      minHeight="0.75rem"
                      minWidth="0.75rem"
                      marginRight={SPACING.spacing3}
                    />
                  ) : (
                    <Flex marginLeft={SPACING.spacingM} />
                  )}
                  <StyledText as="p">{name}</StyledText>
                </Flex>
              </TableDatum>
              <TableDatum
                style={{
                  textAlign: 'center',
                }}
              >
                <StyledText as="p" alignSelf={TYPOGRAPHY.textAlignCenter}>
                  {count}
                </StyledText>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
