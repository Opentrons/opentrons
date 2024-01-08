import * as React from 'react'
import mqtt from 'mqtt'
import uniqueId from 'lodash/uniqueId'
import { useAllCommandsQuery } from '@opentrons/react-api-client'
import { useQuery, useQueryClient } from 'react-query'

import { useRunStatus } from '../../RunTimeControl/hooks'
import {
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FINISHING,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

import type { RunTimeCommand } from '@opentrons/shared-data'

const LIVE_RUN_STATUSES = [
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_FINISHING,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
]

// TOME: Flush out why this isn't in react-query-client?
export function useLastRunCommandKey(runId: string): string | null {
  const runStatus = useRunStatus(runId)
  const queryClient = useQueryClient()
  // TOME: Don't subscribe if not a live run.
  const isLiveRun = runStatus != null && LIVE_RUN_STATUSES.includes(runStatus)
  const { data: commandsData } = useAllCommandsQuery(runId, {
    cursor: null,
    pageLength: 1,
  })
  const isNotLiveRunCommandKey =
    commandsData?.data?.[0]?.intent !== 'setup'
      ? commandsData?.links?.current?.meta?.key ??
        commandsData?.data?.[0]?.key ??
        null
      : null

  React.useEffect(() => {
    if (isLiveRun) {
      const client = mqtt.connect('ws://broker.emqx.io:8083/mqtt', {
        clientId: uniqueId('emqx_'),
        username: 'emqx2',
        password: '**********',
      })

      client.subscribe(
        'opentrons/test/current_command',
        {
          qos: 1,
        },
        function (err) {
          if (err == null) {
            console.log(
              'NO ERROR SUBSCRIBING TO opentrons/test/current_command'
            )
          } else {
            console.log('ERROR SUBSCRIBING TO opentrons/test/current_command')
            console.log(err)
          }
        }
      )

      client.on('message', function (topic, message) {
        const formattedMessage: RunTimeCommand = JSON.parse(message.toString())
        // message is Buffer
        queryClient.setQueryData(
          ['commands', 'current_command'],
          formattedMessage
        )
      })

      return () => {
        client.end()
      }
    }
  }, [isLiveRun, queryClient])

  const query = useQuery<string | null, Error>(
    ['commands', 'current_command'],
    () => queryClient.getQueryData(['commands', 'current_command']) ?? null,
    {
      onError: () => queryClient.resetQueries(['commands', 'current_command']),
      staleTime: Infinity,
    }
  )
  const liveKey = query.data ?? null

  return isLiveRun ? liveKey : isNotLiveRunCommandKey
}
