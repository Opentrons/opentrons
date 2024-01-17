import * as React from 'react'
import inRange from 'lodash/inRange'

import { useDispatch } from 'react-redux'
import { useQuery, useQueryClient } from 'react-query'

import { useHost } from '@opentrons/react-api-client'

import { appShellListener } from '../../redux/shell/remote'
import {
  notifySubscribeAction,
  notifyUnsubscribeAction,
} from '../../redux/shell'

import type { UseQueryResult, QueryFunction } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { NotifyTopic } from '../../redux/shell/types'
import type { QueryOptionsWithPolling } from './types'

interface UseNotifyServiceProps<TData, Error> {
  topic: NotifyTopic
  queryKey: Array<string | HostConfig | null>
  options: QueryOptionsWithPolling<TData, Error>
}

interface UseNotifyServiceReturn<TData> {
  notifyQueryResponse: UseQueryResult<TData>
  isNotifyError: boolean
}

// TOME: Remember to adjust typing here.
export function useNotifyService<TData>({
  topic,
  queryKey,
  options,
}: UseNotifyServiceProps<TData, Error>): UseNotifyServiceReturn<TData> {
  const dispatch = useDispatch()
  const host = useHost()
  const queryClient = useQueryClient()
  const [isNotifyError, setIsNotifyError] = React.useState(false)
  const mostRecentData = React.useRef<TData | null>(null)

  React.useEffect(() => {
    if (!options.forceHttpPolling) {
      const hostname = host?.hostname ?? null
      const eventEmitter = appShellListener(hostname, topic)

      // Prefer setQueryData and manual callback invocation within onDataListener
      // as opposed to invalidateQueries and manual callback invocation/cache updating
      // within the query function. The former is signficantly more performant: ~25ms vs ~1.5s.
      // TOME: Type this as well. Will be easier once serialization is solved.
      const onDataListener = (data: TData): void => {
        if (!isNotifyError) {
          if (data === 'ECONNFAILED') {
            setIsNotifyError(true)
          } else {
            mostRecentData.current = data
            // Emulate React Query's implict onError behavior when
            // encountering an error status code.
            if (options.onError != null && inRange(data.statusCode, 400, 600)) {
              const err = new Error(
                `NotifyService received status code: ${data.statusCode}`
              )
              console.error(err)
              options.onError(err)
            } else queryClient.setQueryData(queryKey, data)
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

  // TOME: Probably want to type out the status code as being a part of the response object here.

  /* 
  TOME: What am I trying to do?
  If a top level status code is returned, trigger an appropriate onSuccess/onError.
  
  Do I definitively understand the pattern used by React query for websockets?
  */

  const query = useQuery(
    queryKey,
    () => {
      return queryClient.getQueryData(queryKey)
    },
    { ...options, staleTime: Infinity, refetchInterval: false, onError: null }
  )

  return { notifyQueryResponse: query, isNotifyError }
}
