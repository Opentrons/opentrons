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

export function useNotifyService<TData, Error>({
  topic,
  queryKey,
  options,
}: useNotifyServiceProps<TData, Error>): any {
  const dispatch = useDispatch()
  const host = useHost()
  const queryClient = useQueryClient()
  const { forceHttpPolling } = options

  React.useEffect(() => {
    if (forceHttpPolling) {
      const hostname = host?.hostname ?? null
      const eventEmitter = appShellListener(hostname, topic)

      const onDataListener = (data: any): void => {
        console.log('RECEIVING DATA IN LISTENER')
        // TOME: For now, I'm serializing here, but this needs to go elsewhere.
        if (data === 'ECONNFAILED') queryClient.setQueryData(queryKey, data)
        else {
          const formattedData = { data: JSON.parse(JSON.parse(data)).data }
          console.log('🚀 ~ onDataListener ~ formattedData:', formattedData)
          queryClient.setQueryData(queryKey, formattedData)
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
          notifyUnsubscribeAction(hostname, topic)
        }
      }
    }
  }, [])

  return queryClient.getQueryData(queryKey)
}

// TOME: The actual Notifier hooks can go here. This should be a simple wrapper that takes in the react-api-client method. Has a name that contains notify.
export function hasNotifyServiceReceivedError(notifyData: any): boolean {
  if (notifyData === 'ECONNFAILED') return true
  else return false
}
