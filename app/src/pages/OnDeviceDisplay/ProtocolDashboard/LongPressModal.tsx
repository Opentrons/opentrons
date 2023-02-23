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
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { ModalShell } from '../../../molecules/Modal'
import { getPinnedProtocolIds, updateConfigValue } from '../../../redux/config'

import type { Dispatch } from '../../../redux/types'
import type { UseLongPressResult } from '@opentrons/components'
import {
  useCreateRunMutation,
  // TODO useDeleteProtocolMutation,
} from '@opentrons/react-api-client'
import type { ProtocolResource } from '@opentrons/shared-data'

// What is the maxinum number of protocols one can pin?
const MAXIMUM_PINNED_PROTOCOLS = 5

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

  const { createRun } = useCreateRunMutation({
    onSuccess: data => {
      const runId: string = data.data.id
      history.push(`/protocols/${runId}/setup`)
    },
  })

  const handleCloseMaxPinsAlert = (): void => {
    setShowMaxPinsAlert(false)
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
        <ModalShell borderRadius="0.75rem" height="26rem" width="32.375rem">
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing3}
            padding="2.5rem"
          >
            <StyledText
              fontSize="2rem"
              lineHeight="2.625rem"
              fontWeight={TYPOGRAPHY.fontWeightBold}
              textAlign={TYPOGRAPHY.textAlignCenter}
            >
              {t('too_many_pins_header')}
            </StyledText>
            <StyledText
              fontSize="1.75rem"
              lineHeight="2.625rem"
              textAlign={TYPOGRAPHY.textAlignCenter}
            >
              {t('too_many_pins_body')}
            </StyledText>
            <Flex
              backgroundColor={COLORS.blueEnabled}
              borderRadius="0.75rem"
              flexDirection={DIRECTION_COLUMN}
              marginTop={SPACING.spacing6}
              onClick={handleCloseMaxPinsAlert}
              padding={SPACING.spacing4}
            >
              <StyledText
                color={COLORS.white}
                fontSize="1.375rem"
                lineHeight="1.75rem"
                textAlign={TYPOGRAPHY.textAlignCenter}
              >
                {t('got_it')}
              </StyledText>
            </Flex>
          </Flex>
        </ModalShell>
      ) : (
        <ModalShell borderRadius="0.75rem" width="15.625rem">
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
          >
            <Flex
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing3}
              height="4.875rem"
              justifyContent={JUSTIFY_CENTER}
              padding={SPACING.spacing5}
              onClick={handleRunClick}
            >
              <Icon name="play-circle" size="1.5rem" color={COLORS.black} />
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
              gridGap={SPACING.spacing3}
              height="4.875rem"
              justifyContent={JUSTIFY_CENTER}
              padding={SPACING.spacing5}
              onClick={handlePinClick}
            >
              <Icon name="push-pin" size="1.5rem" color={COLORS.black} />
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
              gridGap={SPACING.spacing3}
              height="4.875rem"
              justifyContent={JUSTIFY_CENTER}
              padding={SPACING.spacing5}
              onClick={handleDeleteClick}
            >
              <Icon name="trash" size="1.5rem" color={COLORS.white} />
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
