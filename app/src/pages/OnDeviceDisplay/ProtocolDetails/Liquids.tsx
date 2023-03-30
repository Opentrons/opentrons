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
import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

const Table = styled('table')`
  table-layout: ${SPACING.spacingAuto};
  width: 100%;
  border-spacing: 0 ${BORDERS.size_two};
  margin: ${SPACING.spacing4} 0;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const TableHeader = styled('th')`
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  font-size: ${TYPOGRAPHY.fontSize20};
  padding: 0 ${SPACING.spacing5} ${SPACING.spacing3} ${SPACING.spacing5};
  color: ${COLORS.darkBlack_seventy};
`

const TableRow = styled('tr')`
  height: 5.75rem;
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing4} ${SPACING.spacing5};
  background-color: ${COLORS.light_one};
  font-size: ${TYPOGRAPHY.fontSize22};
  white-space: break-spaces;
  text-overflow: ${WRAP};
  &:first-child {
    border-top-left-radius: ${BORDERS.size_three};
    border-bottom-left-radius: ${BORDERS.size_three};
    width: 80%;
  }
  &:last-child {
    border-top-right-radius: ${BORDERS.size_three};
    border-bottom-right-radius: ${BORDERS.size_three};
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

  return (
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
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                >
                  <Flex
                    borderRadius={BORDERS.size_two}
                    padding={SPACING.spacing4}
                    backgroundColor={COLORS.white}
                    height="3.75rem"
                    width="3.75rem"
                    marginRight={SPACING.spacing4}
                  >
                    <Icon
                      name="circle"
                      color={liquid.displayColor}
                      aria-label={`Liquids_${liquid.displayColor}`}
                    />
                  </Flex>
                  <Flex flexDirection={DIRECTION_COLUMN}>
                    <StyledText lineHeight="1.75rem">
                      {liquid.displayName}
                    </StyledText>
                    <StyledText
                      lineHeight="1.75rem"
                      color={COLORS.darkBlack_seventy}
                    >
                      {liquid.description}
                    </StyledText>
                  </Flex>
                </Flex>
              </TableDatum>

              <TableDatum>
                <Flex
                  backgroundColor={COLORS.darkBlack_twenty}
                  borderRadius={BORDERS.radiusSoftCorners}
                  height="2.75rem"
                  padding={`${SPACING.spacing3} 0.75rem`}
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
