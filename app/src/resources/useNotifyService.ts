import * as React from 'react'

import { useDispatch } from 'react-redux'

import { useHost } from '@opentrons/react-api-client'

import { appShellListener } from '../redux/shell/remote'
import { notifySubscribeAction } from '../redux/shell'
import {
  useTrackEvent,
  ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
} from '../redux/analytics'
import { useIsFlex } from '../organisms/Devices/hooks/useIsFlex'

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
  setRefetchUsingHTTP: (refetch: HTTPRefetchFrequency) => void
  options: QueryOptionsWithPolling<TData, TError>
  hostOverride?: HostConfig | null
}

export function useNotifyService<TData, TError = Error>({
  topic,
  setRefetchUsingHTTP,
  options,
  hostOverride,
}: UseNotifyServiceProps<TData, TError>): void {
  const dispatch = useDispatch()
  const hostFromProvider = useHost()
  const host = hostOverride ?? hostFromProvider
  const hostname = host?.hostname ?? null
  const doTrackEvent = useTrackEvent()
  const isFlex = useIsFlex(host?.robotName ?? '')
  const hasUsedNotifyService = React.useRef(false)
  const { enabled, staleTime, forceHttpPolling } = options

  const shouldUseNotifications =
    !forceHttpPolling &&
    enabled !== false &&
    hostname != null &&
    staleTime !== Infinity

  React.useEffect(() => {
    if (shouldUseNotifications) {
      // Always fetch on initial mount.
      setRefetchUsingHTTP('once')
      appShellListener({
        hostname,
        topic,
        callback: onDataEvent,
      })
      dispatch(notifySubscribeAction(hostname, topic))
      hasUsedNotifyService.current = true
    } else {
      setRefetchUsingHTTP('always')
    }

    return () => {
      if (hasUsedNotifyService.current) {
        appShellListener({
          hostname: hostname as string,
          topic,
          callback: onDataEvent,
          isDismounting: true,
        })
      }
    }
  }, [topic, host, shouldUseNotifications])

  function onDataEvent(data: NotifyResponseData): void {
    if (data === 'ECONNFAILED' || data === 'ECONNREFUSED') {
      setRefetchUsingHTTP('always')
      // TODO(jh 2023-02-23): remove the robot type check once OT-2s support MQTT.
      if (data === 'ECONNREFUSED' && isFlex) {
        doTrackEvent({
          name: ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
          properties: {},
        })
      }
    } else if ('refetchUsingHTTP' in data || 'unsubscribe' in data) {
      setRefetchUsingHTTP('once')
    }
  }
}
