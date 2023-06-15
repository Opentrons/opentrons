import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, formatDistance } from 'date-fns'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
  useLongPress,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { LongPressModal } from './LongPressModal'

import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'

export function ProtocolCard(props: {
  protocol: ProtocolResource
  longPress: React.Dispatch<React.SetStateAction<boolean>>
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
  setTargetProtocol: (targetProtocol: ProtocolResource) => void
  lastRun?: string
}): JSX.Element {
  const {
    protocol,
    lastRun,
    longPress,
    setShowDeleteConfirmationModal,
    setTargetProtocol,
  } = props
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

  React.useEffect(() => {
    if (longpress.isLongPressed) {
      longPress(true)
      setTargetProtocol(protocol)
    }
  }, [longpress.isLongPressed, longPress])

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.light1}
      borderRadius={BORDERS.borderRadiusSize4}
      marginBottom={SPACING.spacing8}
      gridGap={SPACING.spacing48}
      onClick={() => handleProtocolClick(longpress, protocol.id)}
      padding={SPACING.spacing24}
      ref={longpress.ref}
    >
      <Flex width="30.75rem" overflowWrap="anywhere">
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {protocolName}
        </StyledText>
      </Flex>
      <Flex width="9.25rem" justifyContent={JUSTIFY_CENTER}>
        <StyledText as="p" color={COLORS.darkBlack70}>
          {lastRun != null
            ? formatDistance(new Date(lastRun), new Date(), {
                addSuffix: true,
              }).replace('about ', '')
            : t('no_history')}
        </StyledText>
      </Flex>
      <Flex width="10rem">
        <StyledText as="p" color={COLORS.darkBlack70}>
          {format(new Date(protocol.createdAt), 'M/d/yy HH:mm')}
        </StyledText>
        {longpress.isLongPressed && (
          <LongPressModal
            longpress={longpress}
            protocolId={protocol.id}
            setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
          />
        )}
      </Flex>
    </Flex>
  )
}
