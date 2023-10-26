import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Icon, SIZE_4, Box, SPACING } from '@opentrons/components'
import {
  fetchProtocols,
  getStoredProtocol,
} from '../../../redux/protocol-storage'

import type { Dispatch, State } from '../../../redux/types'
import type { NavRouteParams } from '../../../App/types'

import { ProtocolTimelineScrubber } from '../../../organisms/ProtocolTimelineScrubber'
import { getRobotTypeFromLoadedLabware } from '@opentrons/shared-data'

export function ProtocolTimeline(): JSX.Element {
  const { protocolKey } = useParams<NavRouteParams>()
  const dispatch = useDispatch<Dispatch>()
  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )

  React.useEffect(() => {
    dispatch(fetchProtocols())
  }, [])

  return storedProtocol != null && storedProtocol.mostRecentAnalysis != null ? (
    <Box padding={SPACING.spacing16}>
      <ProtocolTimelineScrubber
        commands={storedProtocol.mostRecentAnalysis.commands}
        analysis={storedProtocol.mostRecentAnalysis}
        robotType={getRobotTypeFromLoadedLabware(storedProtocol.mostRecentAnalysis.labware)}
      />
    </Box>
  ) : (
    <Icon size={SIZE_4} name="ot-spinner" spin />
  )
}
