import React from 'react'
import mqtt from 'mqtt'
import { uniqueId } from 'lodash'
import { useQuery, useQueryClient } from 'react-query'

import { MaintenanceRun } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useCurrentMaintenanceRun<TError = Error>(
  options: UseQueryOptions<MaintenanceRun | null, TError> = {}
): UseQueryResult<MaintenanceRun | null, TError> {
  const host = useHost()
  const queryClient = useQueryClient()

  React.useEffect(() => {
    const client = mqtt.connect('ws://broker.emqx.io:8083/mqtt', {
      clientId: uniqueId('emqx_'),
      username: 'emqx2',
      password: '**********',
    })

    client.subscribe(
      'opentrons/test/maintenance_runs',
      {
        qos: 2,
      },
      function (err) {
        if (err == null) {
          console.log('NO ERROR SUBSCRIBING TO opentrons/test/maintenance_runs')
        } else {
          console.log('ERROR SUBSCRIBING TO opentrons/test/maintenance_runs')
          console.log(err)
        }
      }
    )

    client.on('message', function (topic, message) {
      let formattedMessage = JSON.parse(message.toString())
      formattedMessage =
        formattedMessage != null
          ? { data: JSON.parse(formattedMessage.data) }
          : null
      console.log(
        '🚀 ~ file: useCurrentMaintenanceRun.ts:37 ~ formattedMessage:',
        formattedMessage
      )

      // message is Buffer
      queryClient.setQueryData(
        [host, 'maintenance_runs', 'current_run'],
        formattedMessage
      )
    })

    return () => {
      client.end()
    }
  }, [host, queryClient])

  const query = useQuery<MaintenanceRun | null, TError>(
    [host, 'maintenance_runs', 'current_run'],
    () =>
      queryClient.getQueryData([host, 'maintenance_runs', 'current_run']) ??
      null,
    {
      ...options,
      enabled: host !== null && options.enabled !== false,
      onError: () =>
        queryClient.resetQueries([host, 'maintenance_runs', 'current_run']),
      staleTime: Infinity,
    }
  )

  return query
}
