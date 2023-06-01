import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
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
  POSITION_STICKY,
  POSITION_STATIC,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'
import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Navigation } from '../../organisms/OnDeviceDisplay/Navigation'
import { onDeviceDisplayRoutes } from '../../App/OnDeviceDisplayApp'
import {
  getPinnedProtocolIds,
  getProtocolsOnDeviceSortKey,
  updateConfigValue,
} from '../../redux/config'
import { PinnedProtocolCarousel } from './PinnedProtocolCarousel'
import { sortProtocols } from './utils'
import { ProtocolCard } from './ProtocolCard'
import { DeleteProtocolConfirmationModal } from './DeleteProtocolConfirmationModal'

import imgSrc from '../../assets/images/on-device-display/empty_protocol_dashboard.png'

import type { Dispatch } from '../../redux/types'
import type { ProtocolsOnDeviceSortKey } from '../../redux/config/types'
import type { ProtocolResource } from '@opentrons/shared-data'

export function ProtocolDashboard(): JSX.Element {
  const protocols = useAllProtocolsQuery()
  const runs = useAllRunsQuery()
  const { t } = useTranslation('protocol_info')
  const dispatch = useDispatch<Dispatch>()
  const [navMenuIsOpened, setNavMenuIsOpened] = React.useState<boolean>(false)
  const [
    longPressModalIsOpened,
    setLongPressModalOpened,
  ] = React.useState<boolean>(false)
  const [
    showDeleteConfirmationModal,
    setShowDeleteConfirmationModal,
  ] = React.useState<boolean>(false)
  const [
    targetProtocol,
    setTargetProtocol,
  ] = React.useState<ProtocolResource | null>(null)
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
    <>
      {showDeleteConfirmationModal ? (
        <DeleteProtocolConfirmationModal
          protocolId={targetProtocol?.id}
          protocolName={
            targetProtocol?.metadata.protocolName != null
              ? targetProtocol.metadata.protocolName
              : targetProtocol?.files[0].name
          }
          setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        minHeight="25rem"
        paddingX={SPACING.spacing40}
        paddingBottom={SPACING.spacing40}
      >
        <Navigation
          routes={onDeviceDisplayRoutes}
          setNavMenuIsOpened={setNavMenuIsOpened}
          longPressModalIsOpened={longPressModalIsOpened}
        />
        {pinnedProtocols.length > 0 && (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            marginBottom={SPACING.spacing32}
          >
            <StyledText
              as="p"
              marginBottom={SPACING.spacing8}
              color={COLORS.darkBlack70}
            >
              {t('pinned_protocols')}
            </StyledText>
            <PinnedProtocolCarousel
              pinnedProtocols={pinnedProtocols}
              longPress={setLongPressModalOpened}
              setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
            />
          </Flex>
        )}
        {sortedProtocols.length > 0 ? (
          <>
            <Flex
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.white}
              flexDirection={DIRECTION_ROW}
              paddingBottom={SPACING.spacing16}
              paddingTop={SPACING.spacing16}
              position={
                navMenuIsOpened || longPressModalIsOpened
                  ? POSITION_STATIC
                  : POSITION_STICKY
              }
              top="7.75rem"
              zIndex={navMenuIsOpened || longPressModalIsOpened ? 0 : 3}
              width="100%"
            >
              <Flex width="30.75rem">
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
              <Flex justifyContent={JUSTIFY_CENTER} width="12rem">
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
              <Flex justifyContent={JUSTIFY_CENTER} width="17rem">
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
                    longPress={setLongPressModalOpened}
                    setShowDeleteConfirmationModal={
                      setShowDeleteConfirmationModal
                    }
                    setTargetProtocol={setTargetProtocol}
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
                backgroundColor={COLORS.darkBlack20}
                flexDirection={DIRECTION_COLUMN}
                height="27.25rem"
                justifyContent={JUSTIFY_CENTER}
                borderRadius={BORDERS.borderRadiusSize3}
              >
                <img
                  alt={t('nothing_here_yet')}
                  src={imgSrc}
                  width="284px"
                  height="166px"
                />
                <StyledText
                  as="h3"
                  fontWeight={TYPOGRAPHY.fontWeightBold}
                  marginTop={SPACING.spacing16}
                  marginBottom={SPACING.spacing8}
                >
                  {t('nothing_here_yet')}
                </StyledText>
                <StyledText as="h4" color={COLORS.darkBlack70}>
                  {t('send_a_protocol_to_store')}
                </StyledText>
              </Flex>
            )}
          </>
        )}
      </Flex>
    </>
  )
}
