import { Link } from 'react-router-dom'

import {
  COLORS,
  Flex,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useQuickProtocolDetailsForRun } from '/app/resources/runs'

import type { ReactNode } from 'react'

interface RunHeaderProtocolNameProps {
  runId: string
}

// Styles the protocol name copy.
export function RunHeaderProtocolName({
  runId,
}: RunHeaderProtocolNameProps): ReactNode {
  const { protocolKey, displayName } = useQuickProtocolDetailsForRun(runId)

  return (
    <Flex>
      {protocolKey != null ? (
        <Link to={`/protocols/${protocolKey}`}>
          <LegacyStyledText
            forwardedAs="h2"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={COLORS.blue50}
          >
            {displayName}
          </LegacyStyledText>
        </Link>
      ) : (
        <LegacyStyledText
          forwardedAs="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {displayName}
        </LegacyStyledText>
      )}
    </Flex>
  )
}
