import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { format, formatDistance } from 'date-fns'
import {
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  truncateString,
  TYPOGRAPHY,
  useLongPress,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { LongPressModal } from './LongPressModal'

import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'

export type CardSizeType = 'full' | 'half' | 'regular'

export function PinnedProtocol(props: {
  protocol: ProtocolResource
  longPress: React.Dispatch<React.SetStateAction<boolean>>
  cardSize?: CardSizeType
  lastRun?: string
}): JSX.Element {
  const { lastRun, protocol, longPress } = props
  const cardSize = props.cardSize ?? 'full'
  const history = useHistory()
  const longpress = useLongPress()
  const protocolName = protocol.metadata.protocolName ?? protocol.files[0].name
  const displayedName = truncateString(protocolName, 59)
  const { t } = useTranslation('protocol_info')

  const cardStyleBySize: {
    [s in CardSizeType]: {
      fontSize: string
      height: string
      lineHeight: string
      width: string
    }
  } = {
    full: {
      fontSize: TYPOGRAPHY.fontSize32,
      height: '8.875rem',
      lineHeight: TYPOGRAPHY.lineHeight42,
      width: '100%',
    },
    half: {
      fontSize: TYPOGRAPHY.fontSize28,
      height: '10.75rem',
      lineHeight: TYPOGRAPHY.lineHeight36,
      width: '29.25rem',
    },
    regular: {
      fontSize: TYPOGRAPHY.fontSize28,
      height: '10.75rem',
      lineHeight: TYPOGRAPHY.lineHeight36,
      width: '28.375rem',
    },
  }

  const handleProtocolClick = (
    longpress: UseLongPressResult,
    protocolId: string
  ): void => {
    if (!longpress.isLongPressed) {
      history.push(`/protocols/${protocolId}`)
    }
  }
  React.useEffect(() => {
    if (longpress.isLongPressed) {
      longPress(true)
    }
  }, [longpress.isLongPressed, longPress])

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.light1}
      borderRadius={BORDERS.size4}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing24}
      height={cardStyleBySize[cardSize].height}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      maxWidth={cardStyleBySize[cardSize].width}
      minWidth={cardStyleBySize[cardSize].width}
      onClick={() => handleProtocolClick(longpress, protocol.id)}
      overflowWrap="anywhere"
      padding={SPACING.spacing24}
      ref={longpress.ref}
    >
      <StyledText
        fontSize={cardStyleBySize[cardSize].fontSize}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        lineHeight={cardStyleBySize[cardSize].lineHeight}
      >
        {displayedName}
      </StyledText>
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing8}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        width="100%"
        color={COLORS.darkBlack70}
      >
        <StyledText as="p">
          {lastRun !== undefined
            ? `${t('last_run')} ${formatDistance(
                new Date(lastRun),
                new Date(),
                {
                  addSuffix: true,
                }
              ).replace('about ', '')}`
            : t('no_history')}
        </StyledText>
        <StyledText as="p">
          {format(new Date(protocol.createdAt), 'M/d/yyyy HH:mm')}
        </StyledText>
      </Flex>
      {longpress.isLongPressed === true && (
        <LongPressModal longpress={longpress} protocolId={protocol.id} />
      )}
    </Flex>
  )
}
