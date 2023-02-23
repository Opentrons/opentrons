import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_HIDDEN,
  SPACING,
  TYPOGRAPHY,
  useSwipe,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'
import { StyledText } from '../../../atoms/text'
import { Navigation } from '../../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'
import {
  getPinnedProtocolIds,
  getProtocolsOnDeviceSortKey,
  updateConfigValue,
} from '../../../redux/config'
import { PinnedProtocol } from './PinnedProtocol'
import { ProtocolRow } from './ProtocolRow'
import { sortProtocols } from './utils'

import imgSrc from '../../../assets/images/odd/abstract@x2.png'

import type { Dispatch } from '../../../redux/types'
import type { ProtocolsOnDeviceSortKey } from '../../../redux/config/types'
import type { ProtocolResource } from '@opentrons/shared-data'

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

export function ProtocolDashboard(): JSX.Element {
  const protocols = useAllProtocolsQuery()
  const runs = useAllRunsQuery()
  const { t } = useTranslation('protocol_info')
  const dispatch = useDispatch<Dispatch>()
  const sortBy = useSelector(getProtocolsOnDeviceSortKey) ?? 'alphabetical'
  const pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const protocolsData = protocols.data?.data != null ? protocols.data?.data : []
  let pinnedProtocols: ProtocolResource[] = []
  for (const id of pinnedProtocolIds) {
    const protocol = protocolsData.find(p => p.id === id)
    if (protocol !== undefined) {
      pinnedProtocols.push(protocol)
    }
  }
  const unpinnedProtocols = protocolsData.filter(
    p => !pinnedProtocolIds.includes(p.id)
  )
  const runData = runs.data?.data != null ? runs.data?.data : []
  const sortedProtocols = sortProtocols(sortBy, unpinnedProtocols, runData)

  const handleProtocolsBySortKey = (
    sortKey: ProtocolsOnDeviceSortKey
  ): void => {
    dispatch(updateConfigValue('protocols.protocolsOnDeviceSortKey', sortKey))
  }

  const handleSortByName = (): void => {
    if (sortBy === 'alphabetical') {
      handleProtocolsBySortKey('reverse')
    } else {
      handleProtocolsBySortKey('alphabetical')
    }
  }

  const handleSortByLastRun = (): void => {
    if (sortBy === 'recentRun') {
      handleProtocolsBySortKey('oldRun')
    } else {
      handleProtocolsBySortKey('recentRun')
    }
  }

  const handleSortByDate = (): void => {
    if (sortBy === 'recentCreated') {
      handleProtocolsBySortKey('oldCreated')
    } else {
      handleProtocolsBySortKey('recentCreated')
    }
  }

  const swipe = useSwipe()

  if (pinnedProtocols.length > 3 && swipe.swipeType === 'swipe-left') {
    const inView = pinnedProtocols.slice(0, 3)
    const outOfView = pinnedProtocols.slice(3)
    pinnedProtocols = [...outOfView, ...inView]
    dispatch(
      updateConfigValue(
        'protocols.pinnedProtocolIds',
        pinnedProtocols.map(p => p.id)
      )
    )
    swipe.setSwipeType('')
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <Navigation routes={onDeviceDisplayRoutes} />
      {pinnedProtocols.length > 0 && (
        <Flex flexDirection={DIRECTION_COLUMN} height="15rem">
          <StyledText
            fontSize="1.25rem"
            lineHeight="1.5rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            Pinned Protocols
          </StyledText>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_FLEX_START}
            gridGap={SPACING.spacing3}
            ref={swipe.ref}
            overflow={OVERFLOW_HIDDEN}
          >
            {pinnedProtocols.map(protocol => {
              return <PinnedProtocol key={protocol.key} protocol={protocol} />
            })}
          </Flex>
        </Flex>
      )}
      {sortedProtocols.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <TableHeader>
                <Flex flexDirection="row" alignItems="center">
                  <Btn onClick={handleSortByName}>
                    <StyledText
                      fontSize="1.25rem"
                      lineHeight="1.6875rem"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    >
                      {t('protocol_name_title')}
                    </StyledText>
                  </Btn>
                  {sortBy === 'alphabetical' || sortBy === 'reverse' ? (
                    <Icon
                      name={
                        sortBy === 'alphabetical'
                          ? 'chevron-down'
                          : 'chevron-up'
                      }
                      size="1rem"
                    />
                  ) : null}
                </Flex>
              </TableHeader>
              <TableHeader>
                <Flex flexDirection="row" alignItems="center">
                  <Btn onClick={handleSortByLastRun}>
                    <StyledText
                      fontSize="1.25rem"
                      lineHeight="1.6875rem"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    >
                      {t('last_run')}
                    </StyledText>
                  </Btn>
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
                  <Btn onClick={handleSortByDate}>
                    <StyledText
                      fontSize="1.25rem"
                      lineHeight="1.6875rem"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    >
                      {t('date_added')}
                    </StyledText>
                  </Btn>
                  {sortBy === 'recentCreated' || sortBy === 'oldCreated' ? (
                    <Icon
                      name={
                        sortBy === 'recentCreated'
                          ? 'chevron-down'
                          : 'chevron-up'
                      }
                      size="1rem"
                    />
                  ) : null}
                </Flex>
              </TableHeader>
            </tr>
          </thead>

          <tbody>
            {sortedProtocols.map(protocol => {
              const lastRun = runs.data?.data.find(
                run => run.protocolId === protocol.id
              )?.createdAt

              return (
                <ProtocolRow
                  key={protocol.key}
                  lastRun={lastRun}
                  protocol={protocol}
                />
              )
            })}
          </tbody>
        </Table>
      ) : (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          height="27.75rem"
          backgroundColor={COLORS.medGreyEnabled}
        >
          <img title={t('nothing_here_yet')} src={imgSrc} />
          <StyledText
            fontSize="2rem"
            lineHeight="2.75rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('nothing_here_yet')}
          </StyledText>
          <StyledText
            fontSize="1.25rem"
            lineHeight="1.6875rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {t('send_a_protocol_to_store')}
          </StyledText>
        </Flex>
      )}
    </Flex>
  )
}
