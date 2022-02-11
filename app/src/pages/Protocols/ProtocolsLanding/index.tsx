import * as React from 'react'
// import { useTranslation } from 'react-i18next'
import { ProtocolsEmptyState } from '../../../organisms/Protocols/ProtocolsEmptyState'

import { Box } from '@opentrons/components'

export function ProtocolsLanding(): JSX.Element {
  return (
    <Box>
      <ProtocolsEmptyState />
    </Box>
  )
}
