import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useQuery, useQueryClient } from 'react-query'

import { useHost } from '@opentrons/react-api-client'

import { appShellListener } from '../../redux/shell/remote'
import {
  notifySubscribeAction,
  notifyUnsubscribeAction,
} from '../../redux/shell'

import type { HostConfig } from '@opentrons/api-client'
import type { NotifyTopic } from '../../redux/shell/types'

interface useNotifyServiceProps {
  topic: NotifyTopic
  queryKey: Array<string | HostConfig | null>
  forceHttpPolling: boolean
}

// TOME: Remember to adjust typing here.
export function useNotifyService({
  topic,
  queryKey,
  forceHttpPolling,
}: useNotifyServiceProps): any {
  const dispatch = useDispatch()
  const host = useHost()
  const queryClient = useQueryClient()
  const [isNotifyError, setIsNotifyError] = React.useState(false)

  React.useEffect(() => {
    if (!forceHttpPolling) {
      const hostname = host?.hostname ?? null
      const eventEmitter = appShellListener(hostname, topic)

      const onDataListener = (data: any): void => {
        if (!isNotifyError) {
          if (data === 'ECONNFAILED') {
            setIsNotifyError(true)
          } else {
            // TOME: Just temp until serialization nonsense is solved.
            if (topic === 'robot-server/maintenance_runs') {
              const extraCrispy = {
                data: JSON.parse(data.data),
              }
              queryClient.setQueryData(queryKey, extraCrispy)
            } else {
              queryClient.setQueryData(queryKey, data)
            }
          }
        }
      }

      eventEmitter.on('data', onDataListener)

      if (hostname != null) {
        console.log('hitting subscribe!')
        dispatch(notifySubscribeAction(hostname, topic))
      } else {
        console.error('Expected hostname, received null.')
      }

      return () => {
        eventEmitter.off('data', onDataListener)
        if (hostname != null) {
          dispatch(notifyUnsubscribeAction(hostname, topic))
        }
      }
    }
  }, [])

  const query = useQuery(queryKey, () => queryClient.getQueryData(queryKey))

  return { notifyQueryResponse: query, isNotifyError }
}
