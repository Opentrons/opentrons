import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useQuery, useQueryClient } from 'react-query'

import { useHost } from '@opentrons/react-api-client'

import { appShellListener } from '../../redux/shell/remote'
import {
  notifySubscribeAction,
  notifyUnsubscribeAction,
} from '../../redux/shell'

import type { UseQueryResult } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { NotifyTopic } from '../../redux/shell/types'

interface UseNotifyServiceProps {
  topic: NotifyTopic
  queryKey: Array<string | HostConfig | null>
  forceHttpPolling: boolean
}

interface UseNotifyServiceReturn<TData> {
  notifyQueryResponse: UseQueryResult<TData>
  isNotifyError: boolean
}

// TOME: Remember to adjust typing here.
export function useNotifyService<TData>({
  topic,
  queryKey,
  forceHttpPolling,
}: UseNotifyServiceProps): UseNotifyServiceReturn<TData> {
  const dispatch = useDispatch()
  const host = useHost()
  const queryClient = useQueryClient()
  const [isNotifyError, setIsNotifyError] = React.useState(false)

  React.useEffect(() => {
    if (!forceHttpPolling) {
      const hostname = host?.hostname ?? null
      const eventEmitter = appShellListener(hostname, topic)

      // TOME: Type this as well. Will be easier once serialization is solved.
      const onDataListener = (data: TData): void => {
        if (!isNotifyError) {
          if (data === 'ECONNFAILED') {
            setIsNotifyError(true)
          } else {
            queryClient.setQueryData(queryKey, data)
          }
        }
      }

      eventEmitter.on('data', onDataListener)

      if (hostname != null) {
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
