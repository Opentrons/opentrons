import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import { StyledText } from '../../../atoms/text'
import { useRequiredProtocolLabware } from '../../Protocols/hooks'
import { EmptySection } from './EmptySection'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  border-collapse: separate
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing4};
  margin: ${SPACING.spacing16} 0;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing4};
`

const TableRow = styled('tr')`
  background-color: ${COLORS.light1};
  border: 1px ${COLORS.white} solid;
  height: 4.75rem;
`

const TableDatum = styled('td')`
  font-size: ${TYPOGRAPHY.fontSize22};
  font-weight: ${TYPOGRAPHY.lineHeight28};
  padding: ${SPACING.spacing4};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.size4};
    border-bottom-left-radius: ${BORDERS.size4};
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.size4};
    border-bottom-right-radius: ${BORDERS.size4};
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

  return labwareItems.length === 0 ? (
    <EmptySection section="labware" />
  ) : (
    <Table>
      <thead>
        <tr>
          <TableHeader>
            <StyledText
              color={COLORS.darkBlack70}
              fontSize={TYPOGRAPHY.fontSize20}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              lineHeight={TYPOGRAPHY.lineHeight24}
              paddingLeft={SPACING.spacing24}
            >
              {t('labware_name')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText
              color={COLORS.darkBlack70}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              fontSize={TYPOGRAPHY.fontSize20}
              lineHeight={TYPOGRAPHY.lineHeight24}
              textAlign={TYPOGRAPHY.textAlignCenter}
            >
              {t('quantity')}
            </StyledText>
          </TableHeader>
        </tr>
      </thead>
      <tbody>
        {Object.entries(countedNames).map(([name, count]) => {
          const definition = labwareItems.find(
            li => getLabwareDisplayName(li.definition) === name
          )?.definition
          return (
            <TableRow key={name}>
              <TableDatum>
                <Flex
                  flexDirection={DIRECTION_ROW}
                  paddingLeft={SPACING.spacing24}
                >
                  {definition?.namespace === 'opentrons' ? (
                    <Icon
                      color={COLORS.blueEnabled}
                      name="check-decagram"
                      height="1.77125rem"
                      minHeight="1.77125rem"
                      minWidth="1.77125rem"
                      marginRight={SPACING.spacing8}
                    />
                  ) : (
                    <Flex marginLeft={SPACING.spacing20} />
                  )}
                  <StyledText
                    alignItems={ALIGN_CENTER}
                    color={COLORS.darkBlack100}
                    lineHeight={TYPOGRAPHY.lineHeight28}
                  >
                    {name}
                  </StyledText>
                </Flex>
              </TableDatum>
              <TableDatum>
                <StyledText
                  alignItems={ALIGN_CENTER}
                  color={COLORS.darkBlack100}
                  lineHeight={TYPOGRAPHY.lineHeight28}
                  textAlign={TYPOGRAPHY.textAlignCenter}
                >
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
