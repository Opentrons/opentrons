import { useSelector } from 'react-redux'
import { getProtocolName } from '../../redux/protocol'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks'

import { schemaV6Adapter, ProtocolFile } from '@opentrons/shared-data'
import type { State } from '../../redux/types'

interface ProtocolDetails {
  displayName: string | null
  protocolData: ProtocolFile<{}> | null
}

export function useProtocolDetails(): ProtocolDetails {
  let protocolData: ProtocolFile<{}> | null = null
  const protocolAnalysis = useCurrentProtocolRun().protocolRecord?.data.analyses
  if (protocolAnalysis != null) {
    const lastProtocolAnalysis = protocolAnalysis[protocolAnalysis.length - 1]
    if (lastProtocolAnalysis.status === 'completed') {
      protocolData = schemaV6Adapter(lastProtocolAnalysis)
    }
  }
  const displayName = useSelector((state: State) => getProtocolName(state))
  return { displayName, protocolData }
}
