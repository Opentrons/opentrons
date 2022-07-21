import { useEffect, useRef, useState } from 'react'
import last from 'lodash/last'
import { useCurrentRun } from '../ProtocolUpload/hooks'
import { formatInterval } from '../RunTimeControl/utils'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'
interface ProtocolDetails {
  displayName: string | null
  protocolData: ProtocolAnalysisFile<{}> | null
}

// TODO(sb, 2021-11-16) Figure out why this was causing a circular dependency and move out of this hooks file
function useInterval(
  callback: () => unknown,
  delay: number | null,
  immediate: boolean = false
): void {
  const savedCallback: React.MutableRefObject<
    (() => unknown) | undefined
  > = useRef()

  // remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // set up the interval
  useEffect(() => {
    const tick = (): unknown => savedCallback.current && savedCallback.current()
    if (delay !== null && delay > 0) {
      if (immediate) tick()
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay, immediate])
}

function useNow(): string {
  const initialNow = Date()
  const [now, setNow] = useState(initialNow)
  useInterval(() => setNow(Date()), 500, true)
  return now
}

/*
 * @deprecated slated for removal in 5.1.0
 */
export function useProtocolDetails(): ProtocolDetails {
  const protocolData: ProtocolAnalysisFile<{}> | null = null
  const displayName = null
  return { displayName, protocolData }
}

// TODO(mc, 2022-06-21): this hook is not unit tested
export function useTimeElapsedSincePause(): string | null {
  const runRecord = useCurrentRun()
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
  const actions = useCurrentRun()?.data?.actions ?? []

  return (timestamp: string) => {
    const firstPlayAction = actions.find(action => action.actionType === 'play')
    if (firstPlayAction == null) return null // run is unstarted or non-existent
    return formatInterval(firstPlayAction.createdAt, timestamp)
  }
}
