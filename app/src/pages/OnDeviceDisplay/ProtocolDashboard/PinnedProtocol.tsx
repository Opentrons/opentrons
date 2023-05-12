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
  const displayedName = truncateString(
    protocolName,
    cardSize === 'full' ? 115 : 90,
    cardSize === 'full' ? 82 : 45
  )
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
      height: '100%',
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

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.light1}
      borderRadius={BORDERS.size_four}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      height={cardStyleBySize[cardSize].height}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      maxWidth={cardStyleBySize[cardSize].width}
      minWidth={cardStyleBySize[cardSize].width}
      onClick={() => handleProtocolClick(longpress, protocol.id)}
      overflowWrap="anywhere"
      padding={SPACING.spacing16}
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
      >
        <StyledText
          fontSize={TYPOGRAPHY.fontSize22}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          lineHeight={TYPOGRAPHY.lineHeight28}
        >
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
        <StyledText
          fontSize={TYPOGRAPHY.fontSize22}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          lineHeight={TYPOGRAPHY.lineHeight28}
        >
          {format(new Date(protocol.createdAt), 'Pp')}
        </StyledText>
      </Flex>
      {longpress.isLongPressed === true && (
        <LongPressModal longpress={longpress} protocolId={protocol.id} />
      )}
    </Flex>
  )
}
