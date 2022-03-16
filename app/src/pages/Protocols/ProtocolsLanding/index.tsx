import * as React from 'react'
// import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../../../atoms/Buttons'
import { ProtocolsEmptyState } from '../../../organisms/ProtocolsLanding/ProtocolsEmptyState'
import { ProtocolsList } from '../../../organisms/ProtocolsLanding/ProtocolsList'

import { Box } from '@opentrons/components'

export function ProtocolsLanding(): JSX.Element {
  const [protocolsLoaded, setProtocolsLoaded] = React.useState(false)
  return (
    <Box>
      <PrimaryButton
        onClick={() => setProtocolsLoaded(!protocolsLoaded)}
        position="absolute"
        bottom="100px"
      >
        {protocolsLoaded ? 'Hide Loaded Protocols' : 'Show Loaded Protocols'}
      </PrimaryButton>
      {protocolsLoaded ? <ProtocolsList /> : <ProtocolsEmptyState />}
    </Box>
  )
}
