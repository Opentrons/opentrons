import * as React from 'react'
import last from 'lodash/last'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { MICRO_LITERS } from '@opentrons/shared-data'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
} from '@opentrons/api-client'
import { getTotalVolumePerLiquidId } from '../../../organisms/Devices/ProtocolRun/SetupLiquids/utils'
import { StyledText } from '../../../atoms/text'
import { EmptySection } from './EmptySection'

import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

const Table = styled('table')`
  table-layout: ${SPACING.spacingAuto};
  width: 100%;
  border-spacing: 0 ${BORDERS.size2};
  margin: ${SPACING.spacing16} 0;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  font-size: ${TYPOGRAPHY.fontSize20};
  padding: 0 ${SPACING.spacing24} 0 ${SPACING.spacing24};
  color: ${COLORS.darkBlack70};
`

const TableRow = styled('tr')`
  height: 5.75rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing16} ${SPACING.spacing24};
  background-color: ${COLORS.light1};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.size3};
    border-bottom-left-radius: ${BORDERS.size3};
    width: 80%;
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.size3};
    border-bottom-right-radius: ${BORDERS.size3};
  }
`

export const Liquids = (props: { protocolId: string }): JSX.Element => {
  const { protocolId } = props
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(protocolId, {
    staleTime: Infinity,
  })
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? []
  const liquidsInOrder = parseLiquidsInLoadOrder(
    (mostRecentAnalysis as CompletedProtocolAnalysis).liquids ?? [],
    (mostRecentAnalysis as CompletedProtocolAnalysis).commands ?? []
  )
  const labwareByLiquidId = parseLabwareInfoByLiquidId(
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

          <TableHeader>
            {i18n.format(t('total_volume'), 'titleCase')}
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
                    borderRadius={BORDERS.size2}
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
                    <StyledText as="p">
                      {i18n.format(liquid.displayName, 'titleCase')}
                    </StyledText>
                    <StyledText as="p" color={COLORS.darkBlack70}>
                      {i18n.format(liquid.description, 'titleCase')}
                    </StyledText>
                  </Flex>
                </Flex>
              </TableDatum>

              <TableDatum>
                <Flex
                  backgroundColor={COLORS.darkBlack20}
                  borderRadius={BORDERS.radiusSoftCorners}
                  height="2.75rem"
                  padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
                  width="max-content"
                  alignItems={TYPOGRAPHY.textAlignCenter}
                  marginRight={SPACING.spacingAuto}
                >
                  {getTotalVolumePerLiquidId(liquid.id, labwareByLiquidId)}{' '}
                  {MICRO_LITERS}
                </Flex>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
