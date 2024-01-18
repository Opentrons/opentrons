import * as React from 'react'
import inRange from 'lodash/inRange'

import { useDispatch } from 'react-redux'
import { useQuery, useQueryClient } from 'react-query'

import { useHost } from '@opentrons/react-api-client'

import { appShellListener } from '../redux/shell/remote'
import { notifySubscribeAction, notifyUnsubscribeAction } from '../redux/shell'

import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { NotifyTopic } from '../redux/shell/types'

export interface QueryOptionsWithPolling<TData, Error>
  extends UseQueryOptions<TData, Error> {
  refetchInterval: number
  forceHttpPolling?: boolean
}

type DataWithStatusCode<TData> = TData & { statusCode: number }

interface UseNotifyServiceProps<TData, Error> {
  topic: NotifyTopic
  queryKey: Array<HostConfig | string | null>
  options: QueryOptionsWithPolling<TData, Error>
}

interface UseNotifyServiceReturn<TData> {
  notifyQueryResponse: UseQueryResult<TData>
  isNotifyError: boolean
}

export function useNotifyService<TData>({
  topic,
  queryKey,
  options,
}: UseNotifyServiceProps<TData, Error>): UseNotifyServiceReturn<TData> {
  const dispatch = useDispatch()
  const host = useHost()
  const queryClient = useQueryClient()
  const isNotifyError = React.useRef(false)

  React.useEffect(() => {
    if (!options.forceHttpPolling) {
      const hostname = host?.hostname ?? null
      const eventEmitter = appShellListener(hostname, topic)

      // Prefer setQueryData() and manual callback invocation within onDataListener
      // as opposed to invalidateQueries() and manual callback invocation/cache logic
      // within the query function. The former is signficantly more performant: ~25ms vs ~1.5s.
      const onDataListener = (
        data: DataWithStatusCode<TData> | 'ECONNFAILED'
      ): void => {
        if (!isNotifyError.current) {
          if (data === 'ECONNFAILED') {
            isNotifyError.current = true
          } else {
            // Emulate React Query's implict onError behavior when passed an error status code.
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
        console.error('NotifyService expected hostname, received null.')
      }

      return () => {
        eventEmitter.off('data', onDataListener)
        if (hostname != null) {
          dispatch(notifyUnsubscribeAction(hostname, topic))
        }
      }
    }
  }, [])

  const query = useQuery(
    queryKey,
    () => queryClient.getQueryData(queryKey) as TData,
    {
      ...options,
      staleTime: Infinity,
      refetchInterval: false,
      onError: () => null,
    }
  )

  return { notifyQueryResponse: query, isNotifyError: isNotifyError.current }
}
