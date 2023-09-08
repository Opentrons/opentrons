import * as React from 'react'
import difference from 'lodash/difference'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useRouteMatch } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import { useInterval } from '@opentrons/components'
import {
  useAllProtocolIdsQuery,
  useHost,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import {
  getProtocol,
  RUN_ACTION_TYPE_PLAY,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

import { useCurrentRun } from '../organisms/ProtocolUpload/hooks'
import { useToaster } from '../organisms/ToasterOven'
import { checkShellUpdate } from '../redux/shell'

import type { SetStatusBarCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/incidental'
import type { Dispatch } from '../redux/types'

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
  const host = useHost()
  const { t } = useTranslation('protocol_info')
  const { makeToast } = useToaster()
  const queryClient = useQueryClient()
  const protocolIdsQuery = useAllProtocolIdsQuery(
    {
      refetchInterval: PROTOCOL_IDS_RECHECK_INTERVAL_MS,
    },
    true
  )
  const protocolIds = protocolIdsQuery.data?.data ?? []
  const protocolIdsRef = React.useRef(protocolIds)
  const hasRefetched = React.useRef(true)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const animationCommand: SetStatusBarCreateCommand = {
    commandType: 'setStatusBar',
    params: { animation: 'confirm' },
  }

  if (protocolIdsQuery.isRefetching) {
    hasRefetched.current = false
  }

  React.useEffect(() => {
    const newProtocolIds = difference(protocolIds, protocolIdsRef.current)
    if (!hasRefetched.current && newProtocolIds.length > 0) {
      Promise.all(
        newProtocolIds.map(protocolId => {
          if (host != null) {
            return (
              getProtocol(host, protocolId).then(
                data =>
                  data.data.data.metadata.protocolName ??
                  data.data.data.files[0].name
              ) ?? ''
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
            makeToast(
              t('protocol_added', {
                protocol_name: name,
              }),
              'success',
              {
                closeButton: true,
                disableTimeout: true,
              }
            )
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
          createLiveCommand({
            command: animationCommand,
          }).catch((e: Error) =>
            console.warn(`cannot run status bar animation: ${e.message}`)
          )
        })
        .catch((e: Error) => {
          console.error(e)
        })
    }
    protocolIdsRef.current = protocolIds
    // dont want this hook to rerun when other deps change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolIds])
}

export function useCurrentRunRoute(): string | null {
  const runRecord = useCurrentRun()

  const isRunSetupRoute = useRouteMatch('/runs/:runId/setup')
  if (isRunSetupRoute != null && runRecord == null) return '/protocols'

  const runStatus = runRecord?.data.status
  const runActions = runRecord?.data.actions
  if (runRecord == null || runStatus == null || runActions == null) return null

  // grabbing run id off of the run query to have all routing info come from one source of truth
  const runId = runRecord.data.id
  const hasRunBeenStarted = runActions?.some(
    action => action.actionType === RUN_ACTION_TYPE_PLAY
  )
  if (
    runStatus === RUN_STATUS_SUCCEEDED ||
    (runStatus === RUN_STATUS_STOPPED && hasRunBeenStarted) ||
    runStatus === RUN_STATUS_FAILED
  ) {
    return `/runs/${runId}/summary`
  } else if (
    runStatus === RUN_STATUS_IDLE ||
    (!hasRunBeenStarted && runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
  ) {
    return `/runs/${runId}/setup`
  } else if (hasRunBeenStarted) {
    return `/runs/${runId}/run`
  } else {
    // includes runs cancelled before starting and runs not yet started
    return null
  }
}
