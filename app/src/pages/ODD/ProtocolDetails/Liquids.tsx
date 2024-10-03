import last from 'lodash/last'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { parseLiquidsInLoadOrder } from '@opentrons/shared-data'
import { EmptySection } from './EmptySection'

import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

const Table = styled('table')`
  table-layout: ${SPACING.spacingAuto};
  width: 100%;
  border-spacing: 0 ${BORDERS.borderRadius8};
  margin: ${SPACING.spacing16} 0;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  font-size: ${TYPOGRAPHY.fontSize20};
  padding: 0 ${SPACING.spacing24} 0 ${SPACING.spacing24};
  color: ${COLORS.grey60};
`

const TableRow = styled('tr')`
  height: 5.75rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing16} ${SPACING.spacing24};
  background-color: ${COLORS.grey35};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.borderRadius12};
    border-bottom-left-radius: ${BORDERS.borderRadius12};
    width: 80%;
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.borderRadius12};
    border-bottom-right-radius: ${BORDERS.borderRadius12};
  }
`

export const Liquids = (props: { protocolId: string }): JSX.Element => {
  const { protocolId } = props
  const { data: protocolData } = useProtocolQuery(protocolId)
  const {
    data: mostRecentAnalysis,
  } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )
  const liquidsInOrder = parseLiquidsInLoadOrder(
    (mostRecentAnalysis as CompletedProtocolAnalysis).liquids ?? [],
    (mostRecentAnalysis as CompletedProtocolAnalysis).commands ?? []
  )
  const { t, i18n } = useTranslation('protocol_details')

  return liquidsInOrder.length === 0 ? (
    <EmptySection section="liquids" />
  ) : (
    <Table>
      <thead>
        <tr>
          <TableHeader>
            {i18n.format(t('liquid_name'), 'titleCase')}
          </TableHeader>
        </tr>
      </thead>
      <tbody>
        {liquidsInOrder.map((liquid, id) => {
          return (
            <TableRow key={id}>
              <TableDatum>
                <Flex
                  flexDirection={DIRECTION_ROW}
                  alignItems={TYPOGRAPHY.textAlignCenter}
                >
                  <Flex
                    borderRadius={BORDERS.borderRadius8}
                    padding={SPACING.spacing16}
                    backgroundColor={COLORS.white}
                    height="3.75rem"
                    width="3.75rem"
                    marginRight={SPACING.spacing16}
                  >
                    <Icon
                      name="circle"
                      color={liquid.displayColor}
                      aria-label={`Liquids_${liquid.displayColor}`}
                    />
                  </Flex>
                  <Flex flexDirection={DIRECTION_COLUMN}>
                    <LegacyStyledText as="p">
                      {i18n.format(liquid.displayName, 'titleCase')}
                    </LegacyStyledText>
                    <LegacyStyledText as="p" color={COLORS.grey60}>
                      {i18n.format(liquid.description, 'titleCase')}
                    </LegacyStyledText>
                  </Flex>
                </Flex>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
