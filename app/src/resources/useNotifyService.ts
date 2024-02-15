import * as React from 'react'

import { useDispatch } from 'react-redux'

import { useHost } from '@opentrons/react-api-client'

import { appShellListener } from '../redux/shell/remote'
import { notifySubscribeAction, notifyUnsubscribeAction } from '../redux/shell'
import {
  useTrackEvent,
  ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
} from '../redux/analytics'

import type { UseQueryOptions } from 'react-query'
import type { NotifyTopic, NotifyResponseData } from '../redux/shell/types'

export interface QueryOptionsWithPolling<TData, TError = Error>
  extends UseQueryOptions<TData, TError> {
  forceHttpPolling?: boolean
}

interface UseNotifyServiceProps<TData, TError = Error> {
  topic: NotifyTopic
  refetchUsingHTTP: () => void
  options: QueryOptionsWithPolling<TData, TError>
}

export function useNotifyService<TData, TError = Error>({
  topic,
  refetchUsingHTTP,
  options,
}: UseNotifyServiceProps<TData, TError>): { isNotifyError: boolean } {
  const dispatch = useDispatch()
  const host = useHost()
  const isNotifyError = React.useRef(false)
  const doTrackEvent = useTrackEvent()
  const { enabled, staleTime, forceHttpPolling } = options
  const hostname = host?.hostname ?? null

  React.useEffect(() => {
    // Always fetch on initial mount.
    refetchUsingHTTP()
    if (
      !forceHttpPolling &&
      enabled !== false &&
      hostname != null &&
      staleTime !== Infinity
    ) {
      const listenerCb = (data: NotifyResponseData): void => onDataEvent(data)
      appShellListener(hostname, topic, listenerCb)
      dispatch(notifySubscribeAction(hostname, topic))

      return () => {
        if (hostname != null) {
          dispatch(notifyUnsubscribeAction(hostname, topic))
        }
      }
    } else {
      if (hostname == null) {
        console.error(
          'NotifyService expected hostname, received null for topic:',
          topic
        )
      }
    }
  }, [topic, host])

  return { isNotifyError: isNotifyError.current }

  function onDataEvent(data: NotifyResponseData): void {
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
        console.log('Unexpected data received from notify service.')
      }
    }
  }
}
