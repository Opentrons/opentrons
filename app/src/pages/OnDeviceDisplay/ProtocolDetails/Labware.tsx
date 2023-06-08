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
  padding: ${SPACING.spacing4};
`

const TableRow = styled('tr')`
  background-color: ${COLORS.light1};
  border: 1px ${COLORS.white} solid;
  height: 4.75rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing4};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.borderRadiusSize4};
    border-bottom-left-radius: ${BORDERS.borderRadiusSize4};
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.borderRadiusSize4};
    border-bottom-right-radius: ${BORDERS.borderRadiusSize4};
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
  const { t, i18n } = useTranslation('protocol_setup')

  return labwareItems.length === 0 ? (
    <EmptySection section="labware" />
  ) : (
    <Table>
      <thead>
        <tr>
          <TableHeader>
            <StyledText
              fontSize={TYPOGRAPHY.fontSize20}
              color={COLORS.darkBlack70}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('labware_name'), 'titleCase')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText
              fontSize={TYPOGRAPHY.fontSize20}
              color={COLORS.darkBlack70}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingRight={SPACING.spacing12}
            >
              {i18n.format(t('quantity'), 'sentenceCase')}
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
                    as="p"
                    alignItems={ALIGN_CENTER}
                    color={COLORS.darkBlack100}
                  >
                    {name}
                  </StyledText>
                </Flex>
              </TableDatum>
              <TableDatum>
                <StyledText
                  as="p"
                  alignItems={ALIGN_CENTER}
                  color={COLORS.darkBlack100}
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
