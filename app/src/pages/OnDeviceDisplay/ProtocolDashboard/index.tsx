import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { format, formatDistance, previousDay } from 'date-fns'
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  truncateString,
  Btn,
  Icon,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'
import { BackButton } from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import {
  getProtocolsStoredSortKey,
  updateConfigValue,
} from '../../../redux/config'
import { useSortProtocols } from './hooks'

import type { Dispatch } from '../../../redux/types'
import type { ProtocolSortKeyType } from './hooks'

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  border-collapse: collapse;
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing2};
  margin: ${SPACING.spacing4} 0;
  text-align: left;
`
const TableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformUppercase};
  color: ${COLORS.darkBlackEnabled};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing2};
`
const TableRow = styled('tr')`
  border: 1px ${COLORS.medGreyHover} solid;
  /* height: 4rem; */
  padding: ${SPACING.spacing5};
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing2};
  white-space: break-spaces;
  text-overflow: wrap;
`

export function ProtocolDashboard(): JSX.Element {
  const protocols = useAllProtocolsQuery()
  const runs = useAllRunsQuery()
  const history = useHistory()
  const { t } = useTranslation('protocol_info')
  const dispatch = useDispatch<Dispatch>()
  const sortBy = useSelector(getProtocolsStoredSortKey) ?? 'alphabetical'
  const protocolsData = protocols.data?.data != null ? protocols.data?.data : []
  const runData = runs.data?.data != null ? runs.data?.data : []
  const sortedProtocols = useSortProtocols(sortBy, protocolsData, runData)

  const handleProtocolsBySortKey = (sortKey: ProtocolSortKeyType): void => {
    dispatch(updateConfigValue('protocols.protocolsStoredSortKey', sortKey))
  }

  const handleSortByName = (): void => {
    if (sortBy === 'alphabetical') {
      handleProtocolsBySortKey('reverse')
      console.log('reverse')
    } else {
      handleProtocolsBySortKey('alphabetical')
      console.log('alphabetical')
    }
  }

  const handleSortByLastRun = (): void => {
    if (sortBy === 'recentRun') {
      handleProtocolsBySortKey('oldRun')
      console.log('oldRun')
    } else {
      handleProtocolsBySortKey('recentRun')
      console.log('recentRun')
    }
  }

  const handleSortByDate = (): void => {
    if (sortBy === 'recentCreated') {
      handleProtocolsBySortKey('oldCreated')
      console.log('oldCreated')
    } else {
      handleProtocolsBySortKey('recentCreated')
      console.log('recentCreated')
    }
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <BackButton />
      <Table>
        <thead>
          <tr>
            <TableHeader>
              <Flex flexDirection="row" alignItems="center">
                <Btn onClick={handleSortByName}>{t('protocol_name_title')}</Btn>
                {sortBy === 'alphabetical' || sortBy === 'reverse' ? (
                  <Icon
                    name={
                      sortBy === 'alphabetical' ? 'chevron-down' : 'chevron-up'
                    }
                    size="1rem"
                  />
                ) : null}
              </Flex>
            </TableHeader>
            <TableHeader>
              <Flex flexDirection="row" alignItems="center">
                <Btn onClick={handleSortByLastRun}>{t('last_run')}</Btn>
                {sortBy === 'recentRun' || sortBy === 'oldRun' ? (
                  <Icon
                    name={
                      sortBy === 'recentRun' ? 'chevron-down' : 'chevron-up'
                    }
                    size="1rem"
                  />
                ) : null}
              </Flex>
            </TableHeader>
            <TableHeader>
              <Flex flexDirection="row" alignItems="center">
                <Btn onClick={handleSortByDate}>{t('date_added')}</Btn>
                {sortBy === 'recentCreated' || sortBy === 'oldCreated' ? (
                  <Icon
                    name={
                      sortBy === 'recentCreated' ? 'chevron-down' : 'chevron-up'
                    }
                    size="1rem"
                  />
                ) : null}
              </Flex>
            </TableHeader>
          </tr>
        </thead>

        <tbody>
          {sortedProtocols.map((protocol, index) => {
            const lastRun = runs.data?.data.find(
              run => run.protocolId === protocol.id
            )?.createdAt

            const protocolName =
              protocol.metadata.protocolName ?? protocol.files[0].name

            return (
              <TableRow
                key={protocol.key ?? index}
                onClick={() => history.push(`/protocols/${protocol.id}`)}
              >
                <TableDatum>
                  <StyledText
                    fontSize="1.5rem"
                    lineHeight="2.0625rem"
                    fontWeight="600"
                  >
                    {truncateString(protocolName, 88, 66)}
                  </StyledText>
                </TableDatum>
                <TableDatum>
                  <StyledText
                    fontSize="1.375rem"
                    lineHeight="1.75rem"
                    fontWeight="400"
                  >
                    {lastRun != null
                      ? formatDistance(new Date(lastRun), new Date(), {
                          addSuffix: true,
                        })
                      : t('no_history')}
                  </StyledText>
                </TableDatum>
                <TableDatum>
                  <StyledText
                    fontSize="1.375rem"
                    lineHeight="1.75rem"
                    fontWeight="400"
                  >
                    {format(new Date(protocol.createdAt), 'Pp')}
                  </StyledText>
                </TableDatum>
              </TableRow>
            )
          })}
        </tbody>
      </Table>
    </Flex>
  )
}
