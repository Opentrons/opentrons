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
  LegacyStyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import { useRequiredProtocolLabware } from '/app/resources/protocols'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  border-collapse: separate
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing8};
  margin: ${SPACING.spacing16} 0;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  padding: ${SPACING.spacing4};
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
    border-top-left-radius: ${BORDERS.borderRadius16};
    border-bottom-left-radius: ${BORDERS.borderRadius16};
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.borderRadius16};
    border-bottom-right-radius: ${BORDERS.borderRadius16};
  }
`

export const Labware = (props: { transferId: string }): JSX.Element => {
  const labwareItems = useRequiredProtocolLabware(props.transferId)
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

  return (
    <Table>
      <thead>
        <tr>
          <TableHeader>
            <LegacyStyledText
              color={COLORS.grey60}
              fontSize={TYPOGRAPHY.fontSize20}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingLeft={SPACING.spacing24}
            >
              {i18n.format(t('labware_name'), 'titleCase')}
            </LegacyStyledText>
          </TableHeader>
          <TableHeader>
            <LegacyStyledText
              alignItems={ALIGN_CENTER}
              color={COLORS.grey60}
              fontSize={TYPOGRAPHY.fontSize20}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              paddingRight={SPACING.spacing12}
              textAlign={TYPOGRAPHY.textAlignCenter}
            >
              {t('quantity')}
            </LegacyStyledText>
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
                      color={COLORS.blue50}
                      name="check-decagram"
                      height="1.77125rem"
                      minHeight="1.77125rem"
                      minWidth="1.77125rem"
                      marginRight={SPACING.spacing8}
                    />
                  ) : (
                    <Flex marginLeft={SPACING.spacing20} />
                  )}
                  <LegacyStyledText as="p" alignItems={ALIGN_CENTER}>
                    {name}
                  </LegacyStyledText>
                </Flex>
              </TableDatum>
              <TableDatum>
                <LegacyStyledText
                  as="p"
                  alignItems={ALIGN_CENTER}
                  textAlign={TYPOGRAPHY.textAlignCenter}
                >
                  {count}
                </LegacyStyledText>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
