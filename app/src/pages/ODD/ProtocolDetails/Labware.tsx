import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { getLabwareDefIsStandard } from '@opentrons/shared-data'

import { useRequiredProtocolLabware } from '/app/resources/protocols'

import { EmptySection } from './EmptySection'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  border-collapse: separate;
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing8};
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  padding: 0 0 0 ${SPACING.spacing24};

  &:first-child {
    width: 100%;
  }

  &:last-child {
    padding: 0 ${SPACING.spacing24} 0 0;
    text-align: ${TYPOGRAPHY.textAlignRight};
  }
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
    padding-right: ${SPACING.spacing24};
    text-align: ${TYPOGRAPHY.textAlignCenter};
    border-top-right-radius: ${BORDERS.borderRadius16};
    border-bottom-right-radius: ${BORDERS.borderRadius16};
  }
`

export const Labware = (props: { protocolId: string }): JSX.Element => {
  const labwareItems = useRequiredProtocolLabware(props.protocolId)

  const { t, i18n } = useTranslation('protocol_details')

  return labwareItems.length === 0 ? (
    <EmptySection section="labware" />
  ) : (
    <Table>
      <thead>
        <tr>
          <TableHeader>
            <StyledText color={COLORS.grey60} oddStyle="smallBodyTextSemiBold">
              {i18n.format(t('labware_name'), 'titleCase')}
            </StyledText>
          </TableHeader>
          <TableHeader>
            <StyledText color={COLORS.grey60} oddStyle="smallBodyTextSemiBold">
              {i18n.format(t('quantity'), 'sentenceCase')}
            </StyledText>
          </TableHeader>
        </tr>
      </thead>
      <tbody>
        {labwareItems.map((labware, index) => {
          return (
            <TableRow key={index}>
              <TableDatum>
                <Flex
                  flexDirection={DIRECTION_ROW}
                  paddingLeft={SPACING.spacing24}
                  alignItems={ALIGN_CENTER}
                >
                  {getLabwareDefIsStandard(labware.labwareDef) ? (
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
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    gridGap={SPACING.spacing4}
                  >
                    <StyledText
                      oddStyle="bodyTextSemiBold"
                      alignItems={ALIGN_CENTER}
                    >
                      {labware.labwareDef.metadata.displayName}
                    </StyledText>
                    {labware.lidDisplayName ? (
                      <StyledText
                        oddStyle="bodyTextRegular"
                        alignItems={ALIGN_CENTER}
                        color={COLORS.grey60}
                      >
                        {t('with_lid_name', { lid: labware.lidDisplayName })}
                      </StyledText>
                    ) : null}
                  </Flex>
                </Flex>
              </TableDatum>
              <TableDatum>
                <StyledText oddStyle="bodyTextSemiBold">
                  {labware.quantity}
                </StyledText>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
