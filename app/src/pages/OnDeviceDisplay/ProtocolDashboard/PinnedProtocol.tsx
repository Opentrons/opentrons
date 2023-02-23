import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  useLongPress,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { LongPressModal } from './LongPressModal'

import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'

export function PinnedProtocol(props: {
  protocol: ProtocolResource
}): JSX.Element {
  const { protocol } = props
  const history = useHistory()

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

  return (
    <Flex
      gridGap={SPACING.spacing3}
      height="13rem"
      alignItems={ALIGN_FLEX_START}
      padding={SPACING.spacing4}
      onClick={() => handleProtocolClick(longpress, protocol.id)}
      ref={longpress.ref}
      border={`1px ${COLORS.medGreyHover} solid`}
      maxWidth="290px"
      minWidth="290px"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <StyledText
        key={protocol.id}
        fontSize="1.5rem"
        lineHeight="2.0625rem"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {protocolName}
      </StyledText>
      <StyledText
        fontSize="1rem"
        lineHeight="1.125rem"
        fontWeight={TYPOGRAPHY.fontWeightRegular}
      >
        {format(new Date(protocol.createdAt), 'MMM Io, p')}
      </StyledText>
      {longpress.isLongPressed && (
        <LongPressModal longpress={longpress} protocol={protocol} />
      )}
    </Flex>
  )
}
