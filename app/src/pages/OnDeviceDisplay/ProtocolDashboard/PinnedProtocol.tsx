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
  cardSize?: CardSizeType
  lastRun?: string
}): JSX.Element {
  const { lastRun, protocol } = props
  const cardSize = props.cardSize ?? 'full'
  const history = useHistory()
  const longpress = useLongPress()
  const protocolName = protocol.metadata.protocolName ?? protocol.files[0].name
  const displayedName = truncateString(protocolName, cardSize === "full" ? 115 : 90,  cardSize === "full" ? 82 : 45)
  const { t } = useTranslation('protocol_info')

  const cardStyleBySize: {
    [s in CardSizeType]: {
      fontSize: string
      lineHeight: string
      width: string
    }
  } = {
    full: {
      fontSize: TYPOGRAPHY.fontSize32,
      lineHeight: TYPOGRAPHY.lineHeight42,
      width: '100%',
    },
    half: {
      fontSize: TYPOGRAPHY.fontSize28,
      lineHeight: TYPOGRAPHY.lineHeight36,
      width: '29.25rem',
    },
    regular: {
      fontSize: TYPOGRAPHY.fontSize28,
      lineHeight: TYPOGRAPHY.lineHeight36,
      width: '28.375rem',
    },
  }

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
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.light_one}
      borderRadius={BORDERS.size_four}
      onClick={() => handleProtocolClick(longpress, protocol.id)}
      gridGap={SPACING.spacing3}
      height="13rem"
      padding={SPACING.spacing4}
      ref={longpress.ref}
      maxWidth={cardStyleBySize[cardSize].width}
      minWidth={cardStyleBySize[cardSize].width}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <StyledText
        key={protocol.id}
        fontSize={cardStyleBySize[cardSize].fontSize}
        lineHeight={cardStyleBySize[cardSize].lineHeight}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {displayedName}
      </StyledText>
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing3}
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <StyledText
          fontSize={TYPOGRAPHY.fontSize22}
          lineHeight={TYPOGRAPHY.lineHeight28}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {lastRun !== undefined
            ? `${String(t('last_run'))} ${formatDistance(
                new Date(lastRun),
                new Date(),
                {
                  addSuffix: true,
                }
              ).replace('about ', '')}`
            : t('no_history')}
        </StyledText>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize22}
          lineHeight={TYPOGRAPHY.lineHeight28}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {format(new Date(protocol.createdAt), 'MMM Io, p')}
        </StyledText>
      </Flex>
      {longpress.isLongPressed === true && (
        <LongPressModal longpress={longpress} protocol={protocol} />
      )}
    </Flex>
  )
}
