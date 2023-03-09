import * as React from 'react'
import last from 'lodash/last'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'
import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import { StyledText } from '../../../atoms/text'
import { getLabwareSetupItemGroups } from '../../../organisms/Devices/ProtocolRun/SetupLabware/utils'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data/js'

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
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(
    props.protocolId,
    {
      staleTime: Infinity,
    }
  )
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null
  const { offDeckItems, onDeckItems } = getLabwareSetupItemGroups(
    (mostRecentAnalysis as CompletedProtocolAnalysis)?.commands ?? []
  )
  const { t } = useTranslation('protocol_setup')
  const labwareItems = [...onDeckItems, ...offDeckItems]

  return (
    <Table>
      <thead>
        <tr>
          <TableHeader>{t('initial_location')}</TableHeader>
          <TableHeader>{t('labware_name')}</TableHeader>
          <TableHeader
            style={{
              textAlign: 'center',
            }}
          >
            Quantity
          </TableHeader>
        </tr>
      </thead>
      <tbody>
        {labwareItems.map((labwareItem, id) => {
          const definition = labwareItem.definition
          const slotInfo: JSX.Element | null =
            labwareItem.initialLocation === 'offDeck'
              ? null
              : t('slot_location', {
                  slotName: Object.values(labwareItem.initialLocation),
                })
          return (
            <TableRow
              key={id}
              style={{
                backgroundColor: '#d6d6d6',
              }}
            >
              <TableDatum>
                <StyledText as="p">{slotInfo}</StyledText>
              </TableDatum>
              <TableDatum>
                <StyledText as="p">
                  {getLabwareDisplayName(definition)}
                </StyledText>
              </TableDatum>
              <TableDatum
                style={{
                  textAlign: 'center',
                }}
              >
                <StyledText as="p" alignSelf={TYPOGRAPHY.textAlignCenter}>
                  1
                </StyledText>
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
