import { Link } from 'react-router-dom'

import {
  COLORS,
  Flex,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useProtocolDetailsForRun } from '/app/resources/runs'

interface RunHeaderProtocolNameProps {
  runId: string
}

// Styles the protocol name copy.
export function RunHeaderProtocolName({
  runId,
}: RunHeaderProtocolNameProps): JSX.Element {
  const { protocolKey, displayName } = useProtocolDetailsForRun(runId)

  return (
    <Flex>
      {protocolKey != null ? (
        <Link to={`/protocols/${protocolKey}`}>
          <LegacyStyledText
            as="h2"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={COLORS.blue50}
          >
            {displayName}
          </LegacyStyledText>
        </Link>
      ) : (
        <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {displayName}
        </LegacyStyledText>
      )}
    </Flex>
  )
}
