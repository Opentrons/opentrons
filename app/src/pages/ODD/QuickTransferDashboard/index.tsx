import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_STATIC,
  POSITION_STICKY,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useInstrumentsQuery,
} from '@opentrons/react-api-client'

import { SmallButton, FloatingActionButton } from '../../../atoms/buttons'
import { Navigation } from '../../../organisms/Navigation'
import {
  getPinnedQuickTransferIds,
  getQuickTransfersOnDeviceSortKey,
  getHasDismissedQuickTransferIntro,
  updateConfigValue,
} from '/app/redux/config'
import { PinnedTransferCarousel } from './PinnedTransferCarousel'
import { sortQuickTransfers } from './utils'
import { QuickTransferCard } from './QuickTransferCard'
import { NoQuickTransfers } from './NoQuickTransfers'
import { PipetteNotAttachedErrorModal } from './PipetteNotAttachedErrorModal'
import { StorageLimitReachedErrorModal } from './StorageLimitReachedErrorModal'
import { IntroductoryModal } from './IntroductoryModal'
import { DeleteTransferConfirmationModal } from './DeleteTransferConfirmationModal'

import type { ProtocolResource } from '@opentrons/shared-data'
import type { PipetteData } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'
import type { QuickTransfersOnDeviceSortKey } from '/app/redux/config/types'

export function QuickTransferDashboard(): JSX.Element {
  const protocols = useAllProtocolsQuery()
  const { data: attachedInstruments } = useInstrumentsQuery()
  const navigate = useNavigate()
  const { t } = useTranslation(['quick_transfer', 'protocol_info'])
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
    showPipetteNotAttachedModal,
    setShowPipetteNotAttaachedModal,
  ] = React.useState<boolean>(false)
  const [
    showStorageLimitReachedModal,
    setShowStorageLimitReachedModal,
  ] = React.useState<boolean>(false)
  const [targetTransferId, setTargetTransferId] = React.useState<string>('')
  const sortBy = useSelector(getQuickTransfersOnDeviceSortKey) ?? 'alphabetical'
  const hasDismissedIntro = useSelector(getHasDismissedQuickTransferIntro)

  const pipetteIsAttached = attachedInstruments?.data.some(
    (i): i is PipetteData => i.ok && i.instrumentType === 'pipette'
  )
  const quickTransfersData =
    protocols.data?.data.filter(protocol => {
      return protocol.protocolKind === 'quick-transfer'
    }) ?? []
  let unpinnedTransfers: ProtocolResource[] = quickTransfersData

  // The pinned protocols are stored as an array of IDs in config
  const pinnedTransferIds = useSelector(getPinnedQuickTransferIds) ?? []
  const pinnedTransfers: ProtocolResource[] = []

  // We only need to grab out the pinned protocol data once all the protocols load
  // and if we have pinned ids stored in config.
  if (quickTransfersData.length > 0 && pinnedTransferIds.length > 0) {
    // First: if they're not in the list, they're not pinned.
    unpinnedTransfers = quickTransfersData.filter(
      p => !pinnedTransferIds.includes(p.id)
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
    for (const id of pinnedTransferIds) {
      const transfer = quickTransfersData.find(p => p.id === id)
      if (transfer !== undefined) {
        pinnedTransfers.push(transfer)
      } else {
        missingIds.push(id)
      }
    }

    // Here's where we'll fix the config if we need to.
    if (missingIds.length > 0) {
      const actualPinnedIds = pinnedTransferIds.filter(
        id => !missingIds.includes(id)
      )
      dispatch(
        updateConfigValue('protocols.pinnedTransferIds', actualPinnedIds)
      )
    }
  }

  const sortedTransfers = sortQuickTransfers(sortBy, unpinnedTransfers)
  const handleTransfersBySortKey = (
    sortKey: QuickTransfersOnDeviceSortKey
  ): void => {
    dispatch(
      updateConfigValue('protocols.quickTransfersOnDeviceSortKey', sortKey)
    )
  }

  const handleSortByName = (): void => {
    if (sortBy === 'alphabetical') {
      handleTransfersBySortKey('reverse')
    } else {
      handleTransfersBySortKey('alphabetical')
    }
  }

  const handleSortByDate = (): void => {
    if (sortBy === 'recentCreated') {
      handleTransfersBySortKey('oldCreated')
    } else {
      handleTransfersBySortKey('recentCreated')
    }
  }

  const handleCreateNewQuickTransfer = (): void => {
    if (!pipetteIsAttached) {
      setShowPipetteNotAttaachedModal(true)
    } else if (quickTransfersData.length >= 20) {
      setShowStorageLimitReachedModal(true)
    } else {
      navigate('/quick-transfer/new')
    }
  }

  return (
    <>
      {!hasDismissedIntro ? (
        <IntroductoryModal
          onClose={() =>
            dispatch(
              updateConfigValue(
                'protocols.hasDismissedQuickTransferIntro',
                true
              )
            )
          }
        />
      ) : null}
      {showDeleteConfirmationModal ? (
        <DeleteTransferConfirmationModal
          transferId={targetTransferId}
          setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
        />
      ) : null}
      {showPipetteNotAttachedModal ? (
        <PipetteNotAttachedErrorModal
          onExit={() => {
            setShowPipetteNotAttaachedModal(false)
          }}
          onAttach={() => {
            navigate('/instruments')
          }}
        />
      ) : null}
      {showStorageLimitReachedModal ? (
        <StorageLimitReachedErrorModal
          onExit={() => {
            setShowStorageLimitReachedModal(false)
          }}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        minHeight="25rem"
        paddingBottom={SPACING.spacing40}
      >
        <Navigation
          setNavMenuIsOpened={setNavMenuIsOpened}
          longPressModalIsOpened={longPressModalIsOpened}
        />
        <Box paddingX={SPACING.spacing40}>
          {pinnedTransfers.length > 0 ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginBottom={SPACING.spacing32}
            >
              <LegacyStyledText
                as="p"
                marginBottom={SPACING.spacing8}
                color={COLORS.grey60}
              >
                {t('pinned_transfers')}
              </LegacyStyledText>
              <PinnedTransferCarousel
                pinnedTransfers={pinnedTransfers}
                longPress={setLongPressModalOpened}
                setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
                setTargetTransferId={setTargetTransferId}
              />
            </Flex>
          ) : null}
          {sortedTransfers.length > 0 ? (
            <>
              <Flex
                alignItems={ALIGN_CENTER}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                backgroundColor={COLORS.white}
                flexDirection={DIRECTION_ROW}
                paddingBottom={SPACING.spacing16}
                position={
                  navMenuIsOpened || longPressModalIsOpened
                    ? POSITION_STATIC
                    : POSITION_STICKY
                }
                top="7.75rem"
                zIndex={navMenuIsOpened || longPressModalIsOpened ? 0 : 3}
                width="100%"
              >
                <Flex width="32.3125rem">
                  <SmallButton
                    buttonText={t('transfer_name')}
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
                <Flex width="14.625rem">
                  <SmallButton
                    buttonText={t('protocol_info:date_added')}
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
                {sortedTransfers.map(transfer => {
                  return (
                    <QuickTransferCard
                      key={transfer.id}
                      quickTransfer={transfer}
                      longPress={setLongPressModalOpened}
                      setShowDeleteConfirmationModal={
                        setShowDeleteConfirmationModal
                      }
                      setTargetTransferId={setTargetTransferId}
                    />
                  )
                })}
              </Flex>
            </>
          ) : pinnedTransfers.length === 0 ? (
            <NoQuickTransfers />
          ) : null}
        </Box>
      </Flex>
      <FloatingActionButton
        buttonText={t('quick_transfer')}
        iconName="plus"
        onClick={handleCreateNewQuickTransfer}
      />
    </>
  )
}
