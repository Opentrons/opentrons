import * as React from 'react'

import { useDispatch } from 'react-redux'

import { useHost } from '@opentrons/react-api-client'

import { appShellListener } from '../redux/shell/remote'
import { notifySubscribeAction } from '../redux/shell'
import {
  useTrackEvent,
  ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
} from '../redux/analytics'

import type { UseQueryOptions } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { NotifyTopic, NotifyResponseData } from '../redux/shell/types'

export type HTTPRefetchFrequency = 'once' | 'always' | null

export interface QueryOptionsWithPolling<TData, TError = Error>
  extends UseQueryOptions<TData, TError> {
  forceHttpPolling?: boolean
}

interface UseNotifyServiceProps<TData, TError = Error> {
  topic: NotifyTopic
  options: QueryOptionsWithPolling<TData, TError>
  hostOverride?: HostConfig | null
}

interface UseNotifyServiceResults {
  notifyOnSettled: () => void
  isNotifyEnabled: boolean
}

export function useNotifyService<TData, TError = Error>({
  topic,
  options,
  hostOverride,
}: UseNotifyServiceProps<TData, TError>): UseNotifyServiceResults {
  const dispatch = useDispatch()
  const hostFromProvider = useHost()
  const host = hostOverride ?? hostFromProvider
  const hostname = host?.hostname ?? null
  const doTrackEvent = useTrackEvent()
  const seenHostname = React.useRef<string | null>(null)
  const [refetch, setRefetch] = React.useState<HTTPRefetchFrequency>(null)

  const { enabled, staleTime, forceHttpPolling } = options

  const shouldUseNotifications =
    !forceHttpPolling &&
    enabled !== false &&
    hostname != null &&
    staleTime !== Infinity

  React.useEffect(() => {
    if (shouldUseNotifications) {
      // Always fetch on initial mount to keep latency as low as possible.
      setRefetch('once')
      appShellListener({
        hostname,
        topic,
        callback: onDataEvent,
      })
      dispatch(notifySubscribeAction(hostname, topic))
      seenHostname.current = hostname
    } else {
      setRefetch('always')
    }

    return () => {
      if (seenHostname.current != null) {
        appShellListener({
          hostname: seenHostname.current,
          topic,
          callback: onDataEvent,
          isDismounting: true,
        })
      }
    }
  }, [topic, hostname, shouldUseNotifications])

  const onDataEvent = React.useCallback((data: NotifyResponseData): void => {
    if (data === 'ECONNFAILED' || data === 'ECONNREFUSED') {
      setRefetch('always')
      if (data === 'ECONNREFUSED') {
        doTrackEvent({
          name: ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
          properties: {},
        })
      }
    } else if ('refetch' in data || 'unsubscribe' in data) {
      setRefetch('once')
    }
  }, [])

  const notifyOnSettled = React.useCallback(() => {
    if (refetch === 'once') {
      setRefetch(null)
    }
  }, [refetch])

  return { notifyOnSettled, isNotifyEnabled: refetch != null }
}
