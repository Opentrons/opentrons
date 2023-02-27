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

// How many pinned protocols fit horizontally on the ODD?
const PINNED_PROTOCOLS_IN_VIEW = 2

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
  const protocolsData = protocols.data?.data != null ? protocols.data?.data : []

  // The pinned protocols are stored as an array of IDs in config
  const pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  // If they're not in the list, they're not pinned.
  const unpinnedProtocols = protocolsData.filter(
    p => !pinnedProtocolIds.includes(p.id)
  )
  // We want an array of protocols in the same order as the
  // array of IDs we stored. There are many ways to sort
  // the pinned protocols. This way is mine.
  let pinnedProtocols: ProtocolResource[] = []
  // Also, while we're here...
  // It's possible (here in the early days while running a simulator, anyway)
  // to lose protocols locally but still have their IDs in the pinned config.
  // If that happens, there's no way to unpin them so let's sync the config
  // back up with the actual protocols we have on hand.
  const missingIds: string[] = []
  for (const id of pinnedProtocolIds) {
    const protocol = protocolsData.find(p => p.id === id)
    if (protocol !== undefined) {
      pinnedProtocols.push(protocol)
    } else {
      missingIds.push(id)
    }
  }
  // Here's where we'll fix the config if we need to.
  if (missingIds.length > 0) {
    const actualPinnedIds = pinnedProtocolIds.filter(
      id => !missingIds.includes(id)
    )
    dispatch(updateConfigValue('protocols.pinnedProtocolIds', actualPinnedIds))
  }

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

  // The pinned protocols are displayed as a horizontal carousel. There can
  // be more pinned than can be shown at once, so the user can swipe through
  // them to "spin" the carousel. This can be simulated via css by sliding
  // divs around, giving negative absolute coordinates, etc., but that can
  // be dicey to get right on a full browser. We've got electron on a tiny
  // touch screen. So let's be more clever than that. Instead of moving things
  // on the screen, how about we just re-order the array? Every swipe, take items
  // off the front and move them to the back. From the user's POV, the effect is
  // the same: things that were offscreen to the right are now in view. To
  // simplify further, I have it so they can just keep swiping to keep spinning
  // the carousel.
  if (pinnedProtocols.length > PINNED_PROTOCOLS_IN_VIEW) {
    if (swipe.swipeType === 'swipe-left') {
      const inView = pinnedProtocols.slice(0, PINNED_PROTOCOLS_IN_VIEW)
      const outOfView = pinnedProtocols.slice(PINNED_PROTOCOLS_IN_VIEW)
      pinnedProtocols = [...outOfView, ...inView]
      dispatch(
        updateConfigValue(
          'protocols.pinnedProtocolIds',
          pinnedProtocols.map(p => p.id)
        )
      )
      swipe.setSwipeType('')
    } else if (swipe.swipeType === 'swipe-right') {
      const lastView = pinnedProtocols.slice(0 - PINNED_PROTOCOLS_IN_VIEW)
      const outOfView = pinnedProtocols.slice(
        0,
        pinnedProtocols.length - PINNED_PROTOCOLS_IN_VIEW
      )
      pinnedProtocols = [...lastView, ...outOfView]
      dispatch(
        updateConfigValue(
          'protocols.pinnedProtocolIds',
          pinnedProtocols.map(p => p.id)
        )
      )
      swipe.setSwipeType('')
    }
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
        <>
          {pinnedProtocols.length === 0 && (
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
        </>
      )}
    </Flex>
  )
}
