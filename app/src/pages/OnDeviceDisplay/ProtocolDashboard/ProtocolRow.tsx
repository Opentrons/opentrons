import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  index: number
  lastRun: string | undefined
}): JSX.Element {
  const { protocol, index, lastRun } = props
  const history = useHistory()
  const { t } = useTranslation('protocol_info')

  const protocolName = protocol.metadata.protocolName ?? protocol.files[0].name

  const longpress = useLongPress()

  const handleProtocolClick = (id: string): void => {
    if (longpress.isLongPressed) {
      alert(`Stop pressing me!`)
      longpress.setIsLongPressed(false)
    } else history.push(`/protocols/${id}`)
  }

  return (
    <TableRow
      key={protocol.key ?? index}
      onClick={() => handleProtocolClick(protocol.id)}
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
      </TableDatum>
    </TableRow>
  )
}
