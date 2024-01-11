import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useQueryClient } from 'react-query'

import { useHost } from './useHost'

import { appShellListener } from '../../../app/src/redux/shell/remote'
import {
  notifySubscribeAction,
  notifyUnsubscribeAction,
} from '../../../app/src/redux/shell'

import type { UseQueryOptions } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { NotifyTopic } from '../../../app/src/redux/shell/types'

export const createNotifyOptions = <TData, TError>(): UseQueryOptions<
  TData,
  TError
> => ({
  staleTime: Infinity,
  refetchInterval: false,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
})

// TOME: Again, you want to use generics here.
export interface QueryOptionsWithPolling<TData, Error>
  extends UseQueryOptions<TData, Error> {
  forceHttpPolling?: boolean
}

interface useNotifyServiceProps<TData, Error> {
  topic: NotifyTopic
  queryKey: Array<string | HostConfig | null>
  options: QueryOptionsWithPolling<TData, Error> // TOME: Will have to mess with this.
}

// TOME: Remember to adjust typing here.
export function useNotifyService<TData, Error>({
  topic,
  queryKey,
  options,
}: useNotifyServiceProps<TData, Error>): any {
  const dispatch = useDispatch()
  const host = useHost()
  const queryClient = useQueryClient()
  const [isNotifyError, setIsNotifyError] = React.useState(false)

  const { forceHttpPolling } = options

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

  return { notifyData: queryClient.getQueryData(queryKey), isNotifyError }
}
