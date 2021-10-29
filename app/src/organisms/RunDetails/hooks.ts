import { useSelector } from 'react-redux'
import { getProtocolData, getProtocolName } from '../../redux/protocol'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { State } from '../../redux/types'

interface ProtocolDetails {
  displayName: string | null
  protocolData: ProtocolFile<{}> | null // TODO: IMMEDIATELY update to ProtocolFileV6 once schema is complete
}

export function useProtocolDetails(): ProtocolDetails {
  const protocolData = useSelector((state: State) =>
    getProtocolData(state)
  ) as ProtocolFile<{}>| null
  const displayName = useSelector((state: State) => getProtocolName(state))
  return { displayName, protocolData }
}
