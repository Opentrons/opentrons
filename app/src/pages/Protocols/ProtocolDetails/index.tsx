import * as React from 'react'
import { useParams } from 'react-router-dom'

import { Box } from '@opentrons/components'

import type { NextGenRouteParams } from '../../../App/NextGenApp'

export function ProtocolDetails(): JSX.Element | null {
  const { protocolKey } = useParams<NextGenRouteParams>()

  return (
      <Box>
        {`TODO:  Details for protocol with key ${protocolKey}`}
      </Box>
  )
}
