import * as React from 'react'
import difference from 'lodash/difference'
import { useQueryClient } from 'react-query'
import { useDispatch } from 'react-redux'
import { useInterval } from '@opentrons/components'
import { getProtocol } from '@opentrons/api-client/src'
import { useAllProtocolIdsQuery, useHost } from '@opentrons/react-api-client'
import { checkShellUpdate } from '../redux/shell'
import { useToaster } from '../organisms/ToasterOven'

import type { Dispatch } from '../redux/types'
import { useAllRunsQuery } from '@opentrons/react-api-client'
import {
  RUN_ACTION_TYPE_PLAY,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

const CURRENT_RUN_POLL = 5000
const UPDATE_RECHECK_INTERVAL_MS = 60000
const PROTOCOL_IDS_RECHECK_INTERVAL_MS = 3000

export function useSoftwareUpdatePoll(): void {
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  useInterval(checkAppUpdate, UPDATE_RECHECK_INTERVAL_MS)
}

export function useProtocolReceiptToast(): void {
  const protocolIdsQuery = useAllProtocolIdsQuery({
    refetchInterval: PROTOCOL_IDS_RECHECK_INTERVAL_MS,
  })
  const protocolIds = protocolIdsQuery.data?.data ?? []
  const host = useHost()
  const { makeToast } = useToaster()
  const queryClient = useQueryClient()

  const protocolIdsRef = React.useRef(protocolIds)

  React.useEffect(() => {
    if (protocolIds.length > protocolIdsRef.current.length) {
      const newProtocolIds = difference(protocolIds, protocolIdsRef.current)

      Promise.all(
        newProtocolIds.map(protocolId => {
          if (host != null) {
            return (
              getProtocol(host, protocolId).then(data => data.data.data.id) ??
              ''
            )
          } else {
            return Promise.reject(
              new Error(
                'no host provider info inside of useProtocolReceiptToast'
              )
            )
          }
        })
      )
        .then(protocolNames => {
          protocolNames.forEach(name => {
            makeToast(`new protocol ${name} added to robot!`, 'info')
          })
        })
        .then(() => {
          queryClient
            .invalidateQueries([host, 'protocols'])
            .catch((e: Error) =>
              console.error(`error invalidating protocols query: ${e.message}`)
            )
        })
        .then(() => {
          protocolIdsRef.current = protocolIds
        })
        .catch((e: Error) => {
          console.error(e)
        })
    }
  })
}

export function useCurrentRunRoute(): string | null {
  const { data: allRuns } = useAllRunsQuery(
    { pageLength: 1 },
    { refetchInterval: CURRENT_RUN_POLL }
  )
  const currentRunLink = allRuns?.links?.current ?? null
  const currentRun =
    currentRunLink != null &&
    typeof currentRunLink !== 'string' &&
    'href' in currentRunLink
      ? allRuns?.data.find(
          run => run.id === currentRunLink.href.replace('/runs/', '')
        ) // trim link path down to only runId
      : null

  const status = currentRun?.status
  const actions = currentRun?.actions
  if (status == null || actions == null || currentRun == null) return null

  const hasBeenStarted = actions?.some(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  if (
    status === RUN_STATUS_SUCCEEDED ||
    status === RUN_STATUS_STOPPED ||
    status === RUN_STATUS_FAILED
  ) {
    return `/runs/${currentRun.id}/summary`
  } else if (
    status === RUN_STATUS_IDLE ||
    (!hasBeenStarted && status === RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
  ) {
    return `/runs/${currentRun.id}/setup`
  } else {
    return `/runs/${currentRun.id}/run`
  }
}
