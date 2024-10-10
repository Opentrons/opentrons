import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  LegacyStyledText,
  MenuItem,
  MenuList,
  SPACING,
} from '@opentrons/components'
import { useCreateRunMutation } from '@opentrons/react-api-client'

import { MAXIMUM_PINNED_PROTOCOLS } from '/app/App/constants'
import { getTopPortalEl } from '/app/App/portal'
import { SmallModalChildren } from '/app/molecules/OddModal'
import { useToaster } from '/app/organisms/ToasterOven'
import { getPinnedQuickTransferIds, updateConfigValue } from '/app/redux/config'

import type { UseLongPressResult } from '@opentrons/components'
import type { Dispatch } from '/app/redux/types'

interface LongPressModalProps {
  longpress: UseLongPressResult
  transferId: string
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
  setTargetTransferId: (targetProtocolId: string) => void
}

export function LongPressModal({
  longpress,
  transferId,
  setShowDeleteConfirmationModal,
  setTargetTransferId,
}: LongPressModalProps): JSX.Element {
  const navigate = useNavigate()
  let pinnedQuickTransferIds = useSelector(getPinnedQuickTransferIds) ?? []
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const { makeSnackbar } = useToaster()

  const pinned = pinnedQuickTransferIds.includes(transferId)

  const [showMaxPinsAlert, setShowMaxPinsAlert] = useState<boolean>(false)

  const { createRun } = useCreateRunMutation({
    onSuccess: data => {
      const runId: string = data.data.id
      navigate(`/runs/${runId}/setup`)
    },
  })

  const handleCloseModal = (): void => {
    longpress.setIsLongPressed(false)
  }

  const handleDeleteClick = (): void => {
    setTargetTransferId(transferId)
    setShowDeleteConfirmationModal(true)
    longpress.setIsLongPressed(false)
  }

  const handlePinClick = (): void => {
    if (!pinned) {
      if (pinnedQuickTransferIds.length === MAXIMUM_PINNED_PROTOCOLS) {
        setShowMaxPinsAlert(true)
      } else {
        pinnedQuickTransferIds.push(transferId)
        handlePinnedQuickTransferIds(pinnedQuickTransferIds)
        makeSnackbar(t('pinned_transfer') as string)
      }
    } else {
      pinnedQuickTransferIds = pinnedQuickTransferIds.filter(
        p => p !== transferId
      )
      handlePinnedQuickTransferIds(pinnedQuickTransferIds)
      makeSnackbar(t('unpinned_transfer') as string)
    }
  }

  const handleRunClick = (): void => {
    longpress.setIsLongPressed(false)
    createRun({ protocolId: transferId })
  }

  const handlePinnedQuickTransferIds = (
    pinnedQuickTransferIds: string[]
  ): void => {
    dispatch(
      updateConfigValue(
        'protocols.pinnedQuickTransferIds',
        pinnedQuickTransferIds
      )
    )
    longpress.setIsLongPressed(false)
  }
  // TODO(sf 10-01-24): Create an ODD-specific component that wraps MenuList with a portal.
  return (
    <>
      {showMaxPinsAlert ? (
        <SmallModalChildren
          header={t('too_many_pins_header')}
          subText={t('too_many_pins_body')}
          buttonText={i18n.format(t('shared:close'), 'capitalize')}
          handleCloseMaxPinsAlert={() => {
            longpress?.setIsLongPressed(false)
          }}
        />
      ) : (
        createPortal(
          <MenuList onClick={handleCloseModal} isOnDevice={true}>
            <MenuItem onClick={handleRunClick} key="play-circle">
              <Flex>
                <Icon name="play-circle" size="1.75rem" />
                <LegacyStyledText marginLeft={SPACING.spacing24}>
                  {t('run_transfer')}
                </LegacyStyledText>
              </Flex>
            </MenuItem>
            <MenuItem onClick={handlePinClick} key="pin">
              <Flex>
                <Icon name="pin" size="2.5rem" />
                <LegacyStyledText marginLeft={SPACING.spacing24}>
                  {pinned ? t('unpin_transfer') : t('pin_transfer')}
                </LegacyStyledText>
              </Flex>
            </MenuItem>
            <MenuItem onClick={handleDeleteClick} key="trash" isAlert={true}>
              <Flex>
                <Icon name="trash" size="2.5rem" />
                <LegacyStyledText marginLeft={SPACING.spacing24}>
                  {t('delete_transfer')}
                </LegacyStyledText>
              </Flex>
            </MenuItem>
          </MenuList>,
          getTopPortalEl()
        )
      )}
    </>
  )
}
