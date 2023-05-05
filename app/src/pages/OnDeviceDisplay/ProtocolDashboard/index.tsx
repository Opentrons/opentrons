import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, formatDistance } from 'date-fns'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  useLongPress,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'
import { SmallButton } from '../../../atoms/buttons/OnDeviceDisplay'
import { StyledText } from '../../../atoms/text'
import { Navigation } from '../../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'
import {
  getPinnedProtocolIds,
  getProtocolsOnDeviceSortKey,
  updateConfigValue,
} from '../../../redux/config'
import { LongPressModal } from './LongPressModal'
import { PinnedProtocolCarousel } from './PinnedProtocolCarousel'
import { sortProtocols } from './utils'

import imgSrc from '../../../assets/images/on-device-display/abstract@x2.png'

import type { Dispatch } from '../../../redux/types'
import type { ProtocolsOnDeviceSortKey } from '../../../redux/config/types'
import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'

export function ProtocolDashboard(): JSX.Element {
  const protocols = useAllProtocolsQuery()
  const runs = useAllRunsQuery()
  const { t } = useTranslation('protocol_info')
  const dispatch = useDispatch<Dispatch>()
  const sortBy = useSelector(getProtocolsOnDeviceSortKey) ?? 'alphabetical'
  const protocolsData = protocols.data?.data != null ? protocols.data?.data : []
  let unpinnedProtocols: ProtocolResource[] = protocolsData

  // The pinned protocols are stored as an array of IDs in config
  const pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const pinnedProtocols: ProtocolResource[] = []

  // We only need to grab out the pinned protocol data once all the protocols load
  // and if we have pinned ids stored in config.
  if (protocolsData.length > 0 && pinnedProtocolIds.length > 0) {
    // First: if they're not in the list, they're not pinned.
    unpinnedProtocols = protocolsData.filter(
      p => !pinnedProtocolIds.includes(p.id)
    )
    // We want an array of protocols in the same order as the
    // array of IDs we stored. There are many ways to sort
    // the pinned protocols. This way is mine.
    //
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
      dispatch(
        updateConfigValue('protocols.pinnedProtocolIds', actualPinnedIds)
      )
    }
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

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      minHeight="25rem"
      paddingX={SPACING.spacing40}
    >
      <Navigation routes={onDeviceDisplayRoutes} />
      {pinnedProtocols.length > 0 && (
        <Flex flexDirection={DIRECTION_COLUMN} marginBottom={SPACING.spacing16}>
          <StyledText
            fontSize={TYPOGRAPHY.fontSize22}
            fontWeight={TYPOGRAPHY.fontWeightBold}
            lineHeight={TYPOGRAPHY.lineHeight28}
            marginBottom="0.5rem"
          >
            {t('pinned_protocols')}
          </StyledText>
          <PinnedProtocolCarousel pinnedProtocols={pinnedProtocols} />
        </Flex>
      )}
      {sortedProtocols.length > 0 ? (
        <>
          <Flex
            alignItems="center"
            backgroundColor={COLORS.white}
            flexDirection={DIRECTION_ROW}
            paddingBottom={SPACING.spacing16}
            paddingTop={SPACING.spacing16}
            position="sticky"
            top="0px"
            width="100%"
          >
            <Flex width="32.3125rem">
              <SmallButton
                buttonText={t('protocol_name_title')}
                buttonType={
                  sortBy === 'alphabetical' || sortBy === 'reverse'
                    ? 'secondary'
                    : 'tertiaryLowLight'
                }
                iconName={
                  sortBy === 'alphabetical' || sortBy === 'reverse'
                    ? sortBy === 'alphabetical'
                      ? 'arrow-down'
                      : 'arrow-up'
                    : undefined
                }
                iconPlacement="endIcon"
                onClick={handleSortByName}
              />
            </Flex>
            <Flex justifyContent="center" width="12rem">
              <SmallButton
                buttonText={t('last_run')}
                buttonType={
                  sortBy === 'recentRun' || sortBy === 'oldRun'
                    ? 'secondary'
                    : 'tertiaryLowLight'
                }
                iconName={
                  sortBy === 'recentRun' || sortBy === 'oldRun'
                    ? sortBy === 'recentRun'
                      ? 'arrow-down'
                      : 'arrow-up'
                    : undefined
                }
                iconPlacement="endIcon"
                onClick={handleSortByLastRun}
              />
            </Flex>
            <Flex justifyContent="center" width="17rem">
              <SmallButton
                buttonText={t('date_added')}
                buttonType={
                  sortBy === 'recentCreated' || sortBy === 'oldCreated'
                    ? 'secondary'
                    : 'tertiaryLowLight'
                }
                iconName={
                  sortBy === 'recentCreated' || sortBy === 'oldCreated'
                    ? sortBy === 'recentCreated'
                      ? 'arrow-down'
                      : 'arrow-up'
                    : undefined
                }
                iconPlacement="endIcon"
                onClick={handleSortByDate}
              />
            </Flex>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN}>
            {sortedProtocols.map(protocol => {
              const lastRun = runs.data?.data.find(
                run => run.protocolId === protocol.id
              )?.createdAt

              return (
                <ProtocolCard
                  key={protocol.id}
                  lastRun={lastRun}
                  protocol={protocol}
                />
              )
            })}
          </Flex>
        </>
      ) : (
        <>
          {pinnedProtocols.length === 0 && (
            <Flex
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.darkBlack_twenty}
              flexDirection={DIRECTION_COLUMN}
              height="27.25rem"
              justifyContent={JUSTIFY_CENTER}
            >
              <img title={t('nothing_here_yet')} src={imgSrc} />
              <StyledText
                fontSize={TYPOGRAPHY.fontSize32}
                fontWeight={TYPOGRAPHY.fontWeightBold}
                lineHeight={TYPOGRAPHY.lineHeight42}
                marginTop={SPACING.spacing16}
                marginBottom={SPACING.spacing8}
              >
                {t('nothing_here_yet')}
              </StyledText>
              <StyledText
                fontSize={TYPOGRAPHY.fontSize28}
                fontWeight={TYPOGRAPHY.fontWeightRegular}
                lineHeight={TYPOGRAPHY.lineHeight36}
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

export function ProtocolCard(props: {
  protocol: ProtocolResource
  lastRun?: string
}): JSX.Element {
  const { protocol, lastRun } = props
  const history = useHistory()
  const { t } = useTranslation('protocol_info')
  const protocolName = protocol.metadata.protocolName ?? protocol.files[0].name
  const longpress = useLongPress()

  const handleProtocolClick = (
    longpress: UseLongPressResult,
    protocolId: string
  ): void => {
    if (longpress.isLongPressed !== true) {
      history.push(`/protocols/${protocolId}`)
    }
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.light_one}
      borderRadius={BORDERS.size_four}
      fontSize={TYPOGRAPHY.fontSize22}
      lineHeight={TYPOGRAPHY.lineHeight28}
      marginBottom={SPACING.spacing8}
      onClick={() => handleProtocolClick(longpress, protocol.id)}
      padding={SPACING.spacing24}
      ref={longpress.ref}
    >
      <Flex width="30.8125rem" overflowWrap="anywhere">
        <StyledText fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {protocolName}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} width="12rem">
        <StyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
          {lastRun != null
            ? formatDistance(new Date(lastRun), new Date(), {
                addSuffix: true,
              }).replace('about ', '')
            : t('no_history')}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} width="17rem">
        <StyledText fontWeight={TYPOGRAPHY.fontWeightRegular}>
          {format(new Date(protocol.createdAt), 'Pp')}
        </StyledText>
        {longpress.isLongPressed && (
          <LongPressModal longpress={longpress} protocolId={protocol.id} />
        )}
      </Flex>
    </Flex>
  )
}
