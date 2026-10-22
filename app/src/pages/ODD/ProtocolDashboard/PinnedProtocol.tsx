import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { css } from 'styled-components'

import {
  ALIGN_FLEX_START,
  BORDERS,
  Chip,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_WRAP_ANYWHERE,
  SPACING,
  StyledText,
  useLongPress,
} from '@opentrons/components'

import { formatTimeWithUtcLabel } from '/app/resources/runs'

import { useUpdatedLastRunTime } from './hooks'
import { LongPressModal } from './LongPressModal'
import styles from './pinnedprotocol.module.css'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'

export type CardSizeType = 'full' | 'half' | 'regular'

const cardStyleBySize: {
  [s in CardSizeType]: {
    height: string
    width: string
  }
} = {
  full: {
    height: '11.75rem',
    width: '59rem',
  },
  // Note (kk:06/13/2024) height has been updated from 10.75rem because of a protocol with RTP CSV file
  half: {
    height: '13.25rem',
    width: '29.25rem',
  },
  regular: {
    height: '13.25rem',
    width: '28.375rem',
  },
}

const protocolNameClassBySize: Record<CardSizeType, string> = {
  full: styles.protocol_name_full,
  half: styles.protocol_name_half,
  regular: styles.protocol_name_regular,
}

interface PinnedProtocolProps {
  protocol: ProtocolResource
  longPress?: Dispatch<SetStateAction<boolean>>
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
  setTargetProtocolId: (targetProtocolId: string) => void
  cardSize?: CardSizeType
  lastRun?: string
  isRequiredCSV?: boolean
}

export function PinnedProtocol(props: PinnedProtocolProps): ReactNode {
  const {
    protocol,
    longPress,
    setShowDeleteConfirmationModal,
    setTargetProtocolId,
    lastRun,
    cardSize: size,
    isRequiredCSV = false,
  } = props
  const cardSize = size ?? 'full'
  const navigate = useNavigate()
  const longpress = useLongPress()
  const protocolName = protocol.metadata.protocolName ?? protocol.files[0].name
  const { t } = useTranslation('protocol_info')

  const updatedLastRun = useUpdatedLastRunTime(lastRun)

  // ToDo (kk:06/18/2024) this will be removed later
  const handleProtocolClick = (
    longpress: UseLongPressResult,
    protocolId: string
  ): void => {
    if (!longpress.isLongPressed) {
      navigate(`/protocols/${protocolId}`)
    }
  }
  useEffect(() => {
    if (longpress.isLongPressed) {
      longPress?.(true)
    }
  }, [longpress.isLongPressed, longPress])

  const pushedBackgroundColor = isRequiredCSV ? COLORS.yellow40 : COLORS.grey50
  const PUSHED_STATE_STYLE = css`
    &:active {
      background-color: ${longpress.isLongPressed ? '' : pushedBackgroundColor};
    }
  `

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={isRequiredCSV ? COLORS.yellow35 : COLORS.grey35}
      borderRadius={BORDERS.borderRadius16}
      css={PUSHED_STATE_STYLE}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing24}
      height={cardStyleBySize[cardSize].height}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      maxWidth={cardStyleBySize[cardSize].width}
      minWidth={cardStyleBySize[cardSize].width}
      onClick={() => {
        handleProtocolClick(longpress, protocol.id)
      }}
      overflowWrap={OVERFLOW_WRAP_ANYWHERE}
      padding={SPACING.spacing24}
      ref={longpress.ref}
      data-testid={`${cardSize}_pinned_protocol_card`}
    >
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        {isRequiredCSV ? (
          <Chip
            type="warning"
            iconName="ot-alert"
            chipSize="small"
            text={t('requires_csv')}
          />
        ) : null}
        <StyledText
          className={clsx(
            styles.protocol_name,
            protocolNameClassBySize[cardSize]
          )}
        >
          {protocolName}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing8}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        width="100%"
        color={COLORS.grey60}
      >
        <StyledText forwardedAs="p">
          {t('last_run_time', { time: updatedLastRun })}
        </StyledText>
        <StyledText forwardedAs="p">
          {t('date_added_date', {
            date: formatTimeWithUtcLabel(protocol.createdAt),
          })}
        </StyledText>
      </Flex>
      {longpress.isLongPressed && (
        <LongPressModal
          longpress={longpress}
          protocolId={protocol.id}
          setTargetProtocolId={setTargetProtocolId}
          setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
        />
      )}
    </Flex>
  )
}
