import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

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
import { SmallModalChildren } from '/app/molecules/OddModal'
import { useToaster } from '/app/organisms/ToasterOven'
import { getPinnedProtocolIds, updateConfigValue } from '/app/redux/config'
import { getTopPortalEl } from '/app/App/portal'

import type { UseLongPressResult } from '@opentrons/components'
import type { Dispatch } from '/app/redux/types'

interface LongPressModalProps {
  longpress: UseLongPressResult
  protocolId: string
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
  setTargetProtocolId: (targetProtocolId: string) => void
}

export function LongPressModal({
  longpress,
  protocolId,
  setShowDeleteConfirmationModal,
  setTargetProtocolId,
}: LongPressModalProps): JSX.Element {
  const navigate = useNavigate()
  let pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const { i18n, t } = useTranslation(['protocol_info', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const { makeSnackbar } = useToaster()

  const pinned = pinnedProtocolIds.includes(protocolId)

  const [showMaxPinsAlert, setShowMaxPinsAlert] = useState<boolean>(false)

  // This looks totally bonkers, and it is. This construction is to make
  // it easier to use in unit tests, where we have to mock both the mutation
  // and the createRun function. The real code didn't like the mock:
  //
  // TypeError: Cannot read properties of undefined (reading 'createRun')
  //
  // Having the empty function fallback lets the mocks get called. In real use it
  // shouldn't ever get needed.
  const createRunUse = useCreateRunMutation({
    onSuccess: data => {
      const runId: string = data.data.id
      navigate(`/runs/${runId}/setup`)
    },
  })
  const createRun =
    createRunUse?.createRun !== undefined ? createRunUse.createRun : () => {}

  const handleCloseModal = (): void => {
    longpress.setIsLongPressed(false)
  }

  const handleDeleteClick = (): void => {
    setTargetProtocolId(protocolId)
    setShowDeleteConfirmationModal(true)
    longpress.setIsLongPressed(false)
  }

  const handlePinClick = (): void => {
    if (!pinned) {
      if (pinnedProtocolIds.length === MAXIMUM_PINNED_PROTOCOLS) {
        setShowMaxPinsAlert(true)
      } else {
        pinnedProtocolIds.push(protocolId)
        handlePinnedProtocolIds(pinnedProtocolIds)
        makeSnackbar(t('pinned_protocol') as string)
      }
    } else {
      pinnedProtocolIds = pinnedProtocolIds.filter(p => p !== protocolId)
      handlePinnedProtocolIds(pinnedProtocolIds)
      makeSnackbar(t('unpinned_protocol') as string)
    }
  }

  const handleRunClick = (): void => {
    longpress.setIsLongPressed(false)
    createRun({ protocolId: protocolId })
  }

  const handlePinnedProtocolIds = (pinnedProtocolIds: string[]): void => {
    dispatch(
      updateConfigValue('protocols.pinnedProtocolIds', pinnedProtocolIds)
    )
    longpress.setIsLongPressed(false)
  }

  // TODO(jh 09-24-24): Create an ODD-specific component that wraps MenuList with a portal.
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
                  {t('run_protocol')}
                </LegacyStyledText>
              </Flex>
            </MenuItem>
            <MenuItem onClick={handlePinClick} key="pin">
              <Flex>
                <Icon name="pin" size="2.5rem" />
                <LegacyStyledText marginLeft={SPACING.spacing24}>
                  {pinned ? t('unpin_protocol') : t('pin_protocol')}
                </LegacyStyledText>
              </Flex>
            </MenuItem>
            <MenuItem onClick={handleDeleteClick} key="trash" isAlert={true}>
              <Flex>
                <Icon name="trash" size="2.5rem" />
                <LegacyStyledText marginLeft={SPACING.spacing24}>
                  {t('delete_protocol')}
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
