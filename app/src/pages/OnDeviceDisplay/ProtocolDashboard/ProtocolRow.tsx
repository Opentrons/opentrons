import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'
import { format, formatDistance } from 'date-fns'
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  truncateString,
  useLongPress,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { LongPressModal } from './LongPressModal'

import type { UseLongPressResult } from '@opentrons/components'
import type { ProtocolResource } from '@opentrons/shared-data'

const TableRow = styled('tr')`
  border: 1px ${COLORS.medGreyHover} solid;
  height: 4rem;
  padding: ${SPACING.spacing5};
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing2};
  white-space: break-spaces;
  text-overflow: wrap;
`

export function ProtocolRow(props: {
  protocol: ProtocolResource
  lastRun?: string
}): JSX.Element {
  const { protocol, lastRun } = props
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

  return (
    <TableRow
      key={protocol.key}
      onClick={() => handleProtocolClick(longpress, protocol.id)}
      ref={longpress.ref}
    >
      <TableDatum>
        <StyledText
          fontSize="1.5rem"
          lineHeight="2.0625rem"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {truncateString(protocolName, 88, 66)}
        </StyledText>
      </TableDatum>
      <TableDatum>
        <StyledText
          fontSize="1.375rem"
          lineHeight="1.75rem"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {lastRun != null
            ? formatDistance(new Date(lastRun), new Date(), {
                addSuffix: true,
              })
            : t('no_history')}
        </StyledText>
      </TableDatum>
      <TableDatum>
        <StyledText
          fontSize="1.375rem"
          lineHeight="1.75rem"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {format(new Date(protocol.createdAt), 'Pp')}
        </StyledText>
        {longpress.isLongPressed && (
          <LongPressModal longpress={longpress} protocolId={protocol.id} />
        )}
      </TableDatum>
    </TableRow>
  )
}
