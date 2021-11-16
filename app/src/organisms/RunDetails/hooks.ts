import { useSelector } from 'react-redux'
import last from 'lodash/last'
import { getProtocolName } from '../../redux/protocol'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks'

import { schemaV6Adapter, ProtocolFile } from '@opentrons/shared-data'
import { formatInterval } from '../RunTimeControl/utils'
import { useNow } from '../RunTimeControl/hooks'
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
  // TODO immediately replace with metadata from protocol record
  const displayName = useSelector((state: State) => getProtocolName(state))
  return { displayName, protocolData }
}

export function useTimeElapsedSincePause(): string | null {
  const { runRecord } = useCurrentProtocolRun()
  const now = useNow()
  const mostRecentAction = last(runRecord?.data.actions)
  if (
    runRecord?.data &&
    ['paused', 'pause-requested'].includes(runRecord?.data.status) &&
    mostRecentAction != null &&
    mostRecentAction?.actionType === 'pause'
  ) {
    return formatInterval(mostRecentAction.createdAt, now)
  }
  return null
}

export function useFormatRunTimestamp(): (timestamp: string) => string | null {
  const { runRecord } = useCurrentProtocolRun()

  return (timestamp: string) => {
    if (runRecord == null) return null // run doesn't exist
    const { actions } = runRecord.data
    const firstPlayAction = actions.find(action => action.actionType === 'play')
    if (firstPlayAction == null) return null // run is unstarted
    return formatInterval(firstPlayAction.createdAt, timestamp)
  }
}
