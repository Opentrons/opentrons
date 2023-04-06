import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'
import {
  useCreateRunMutation,
  // TODO useDeleteProtocolMutation,
} from '@opentrons/react-api-client'

import { MAXIMUM_PINNED_PROTOCOLS } from '../../../App/constants'
import { StyledText } from '../../../atoms/text'
import { ModalShell } from '../../../molecules/Modal'
import { TooManyPinsModal } from '../../../molecules/Modal/OnDeviceDisplay'
import { getPinnedProtocolIds, updateConfigValue } from '../../../redux/config'

import type { Dispatch } from '../../../redux/types'
import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'

export function LongPressModal(props: {
  longpress: UseLongPressResult
  protocol: ProtocolResource
}): JSX.Element {
  const { longpress, protocol } = props
  const history = useHistory()
  let pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const { t } = useTranslation('protocol_info')
  const dispatch = useDispatch<Dispatch>()

  const pinned = pinnedProtocolIds.includes(protocol.id)

  const [showMaxPinsAlert, setShowMaxPinsAlert] = React.useState<boolean>(false)

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
      history.push(`/protocols/${runId}/setup`)
    },
  })
  const createRun =
    createRunUse?.createRun !== undefined ? createRunUse.createRun : () => {}

  const handleCloseModal = (): void => {
    longpress.setIsLongPressed(false)
  }

  // TODO const { deleteProtocol } = useDeleteProtocolMutation(protocol.id)

  const handleDeleteClick = (): void => {
    longpress.setIsLongPressed(false)
    // TODO: deleteProtocol()
    console.log(`deleted protocol with id ${protocol.id}`)
    history.go(0)
  }

  const handlePinClick = (): void => {
    if (!pinned) {
      if (pinnedProtocolIds.length === MAXIMUM_PINNED_PROTOCOLS) {
        setShowMaxPinsAlert(true)
      } else {
        pinnedProtocolIds.push(protocol.id)
        handlePinnedProtocolIds(pinnedProtocolIds)
      }
    } else {
      pinnedProtocolIds = pinnedProtocolIds.filter(p => p !== protocol.id)
      handlePinnedProtocolIds(pinnedProtocolIds)
    }
  }

  const handleRunClick = (): void => {
    longpress.setIsLongPressed(false)
    createRun({ protocolId: protocol.id })
  }

  const handlePinnedProtocolIds = (pinnedProtocolIds: string[]): void => {
    dispatch(
      updateConfigValue('protocols.pinnedProtocolIds', pinnedProtocolIds)
    )

    longpress.setIsLongPressed(false)
  }

  return (
    <>
      {showMaxPinsAlert ? (
        <TooManyPinsModal
          handleCloseMaxPinsAlert={() => longpress?.setIsLongPressed(false)}
        />
      ) : (
        <ModalShell
          borderRadius={BORDERS.size_three}
          onOutsideClick={handleCloseModal}
          width="15.625rem"
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
          >
            <Flex
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacingSM}
              height="4.875rem"
              padding={SPACING.spacing5}
              onClick={handleRunClick}
            >
              <Icon name="play-circle" size="1.75rem" color={COLORS.black} />
              <StyledText
                fontSize="1.375rem"
                lineHeight="1.5rem"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
                textAlign={TYPOGRAPHY.textAlignCenter}
              >
                {t('run_protocol')}
              </StyledText>
            </Flex>
            <Flex
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacingSM}
              height="4.875rem"
              padding={SPACING.spacing5}
              onClick={handlePinClick}
            >
              <Icon name="push-pin" size="1.875rem" color={COLORS.black} />
              <StyledText
                fontSize="1.375rem"
                lineHeight="1.5rem"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
                textAlign={TYPOGRAPHY.textAlignCenter}
              >
                {pinned ? t('unpin_protocol') : t('pin_protocol')}
              </StyledText>
            </Flex>
            <Flex
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.errorEnabled}
              gridGap={SPACING.spacingSM}
              height="4.875rem"
              padding={SPACING.spacing5}
              onClick={handleDeleteClick}
            >
              <Icon name="trash" size="1.875rem" color={COLORS.white} />
              <StyledText
                color={COLORS.white}
                fontSize="1.375rem"
                lineHeight="1.5rem"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
                textAlign={TYPOGRAPHY.textAlignCenter}
              >
                {t('delete_protocol')}
              </StyledText>
            </Flex>
          </Flex>
        </ModalShell>
      )}
    </>
  )
}
