import { useEffect, useRef, useState } from 'react'
import last from 'lodash/last'
import { schemaV6Adapter } from '@opentrons/shared-data'
import { useHost, useRunQuery } from '@opentrons/react-api-client'
import { getCommand } from '@opentrons/api-client'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks'
import { formatInterval } from '../RunTimeControl/utils'
import { useCurrentRunId } from '../ProtocolUpload/hooks/useCurrentRunId'
import type { CommandDetail } from '@opentrons/api-client'
import type { ProtocolFile } from '@opentrons/shared-data'
interface ProtocolDetails {
  displayName: string | null
  protocolData: ProtocolFile<{}> | null
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

export function useProtocolDetails(): ProtocolDetails {
  let protocolData: ProtocolFile<{}> | null = null
  const { protocolRecord } = useCurrentProtocolRun()
  const protocolAnalysis = protocolRecord?.data.analyses
  if (protocolAnalysis != null) {
    const lastProtocolAnalysis = protocolAnalysis[protocolAnalysis.length - 1]
    if (lastProtocolAnalysis.status === 'completed') {
      protocolData = schemaV6Adapter(lastProtocolAnalysis)
    }
  }
  const displayName = protocolRecord?.data.metadata.protocolName ?? null
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
const REFETCH_INTERVAL = 1000
interface CommandDetailsById {
  [commandId: string]: CommandDetail
}
export function useCommandDetailsById(): CommandDetailsById {
  const [
    commandDetailsById,
    setCommandDetailsById,
  ] = useState<CommandDetailsById>({})
  const host = useHost()
  const currentRunId = useCurrentRunId()
  const { data: runRecord } = useRunQuery(currentRunId, {
    refetchInterval: REFETCH_INTERVAL,
  })

  if (host == null) {
    console.error('need host to fetch command details')
    return {}
  }
  if (runRecord == null) {
    console.error('need run record to fetch command details')
    return {}
  }
  if (currentRunId == null) {
    console.error('need current run id to fetch command details')
    return {}
  }

  const runDataCommands = runRecord.data.commands
  const commandIdsToFetch = runDataCommands.reduce<Set<string>>(
    (commandIds, command) => {
      if (!(command.id in commandDetailsById)) {
        // fetch if we have not seen this command before
        return commandIds.add(command.id)
      } else if (
        // fetch if the status has changed, so we can get new startedAt and completedAt values
        command.id in commandDetailsById &&
        commandDetailsById[command.id].data.status !== command.status
      ) {
        return commandIds.add(command.id)
      }
      return commandIds
    },
    new Set()
  )
  // consider chunking network requests the event that there are a large amount of network requests to make
  commandIdsToFetch.forEach(commandId => {
    getCommand(host, currentRunId, commandId)
      .then(response =>
        setCommandDetailsById(prevCommandDetailsById => ({
          ...prevCommandDetailsById,
          [commandId]: response.data,
        }))
      )
      .catch((e: Error) => {
        console.error(`error fetching command details: ${e.message}`)
      })
  })

  return commandDetailsById
}
