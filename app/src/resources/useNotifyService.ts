import * as React from 'react'
import inRange from 'lodash/inRange'

import { useDispatch } from 'react-redux'
import { useQuery, useQueryClient } from 'react-query'

import { useHost } from '@opentrons/react-api-client'

import { appShellListener } from '../redux/shell/remote'
import { notifySubscribeAction, notifyUnsubscribeAction } from '../redux/shell'
import {
  useTrackEvent,
  ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
} from '../redux/analytics'

import type { UseQueryResult, UseQueryOptions, QueryKey } from 'react-query'
import type { NotifyTopic } from '../redux/shell/types'

export interface QueryOptionsWithPolling<TData, Error>
  extends UseQueryOptions<TData, Error> {
  refetchInterval: number | false
  forceHttpPolling?: boolean
}

type DataWithStatusCode<TData> = TData & { statusCode: number }

interface NotifyRefetchData {
  refetchUsingHTTP: boolean
  statusCode: never
}

export type NotifyNetworkError = 'ECONNFAILED' | 'ECONNREFUSED'

type NotifyResponseData<TData> =
  | DataWithStatusCode<TData>
  | NotifyRefetchData
  | NotifyNetworkError

interface UseNotifyServiceProps<TData, Error> {
  topic: NotifyTopic
  queryKey: QueryKey
  refetchUsingHTTP: () => void
  options: QueryOptionsWithPolling<TData, Error>
}

interface UseNotifyServiceReturn<TData> {
  notifyQueryResponse: UseQueryResult<TData>
  isNotifyError: boolean
}

export function useNotifyService<TData>({
  topic,
  queryKey,
  refetchUsingHTTP,
  options,
}: UseNotifyServiceProps<TData, Error>): UseNotifyServiceReturn<TData> {
  const dispatch = useDispatch()
  const host = useHost()
  const queryClient = useQueryClient()
  const isNotifyError = React.useRef(false)
  const doTrackEvent = useTrackEvent()

  React.useEffect(() => {
    if (!options.forceHttpPolling) {
      const hostname = host?.hostname ?? null
      const eventEmitter = appShellListener(hostname, topic)

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

  function onDataListener(data: NotifyResponseData<TData>): void {
    if (!isNotifyError.current) {
      if (data === 'ECONNFAILED' || data === 'ECONNREFUSED') {
        isNotifyError.current = true
        if (data === 'ECONNREFUSED') {
          doTrackEvent({
            name: ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
            properties: {},
          })
        }
      } else if ('refetchUsingHTTP' in data) {
        refetchUsingHTTP()
      } else {
        // Emulate React Query's implict onError behavior when passed an error status code.
        if (options.onError != null && inRange(data.statusCode, 400, 600)) {
          const err = new Error(
            `NotifyService received status code: ${data.statusCode}`
          )
          console.error(err)
          options.onError(err)
        }
        // Prefer setQueryData() and manual callback invocation within onDataListener
        // as opposed to invalidateQueries() and manual callback invocation/cache logic
        // within the query function. The former is signficantly more performant: ~25ms vs ~1.5s.
        else queryClient.setQueryData(queryKey, data)
      }
    }
  }
}
