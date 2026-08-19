import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import { useHost } from '@opentrons/react-api-client'

import {
  ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
  useTrackEvent,
} from '/app/redux/analytics'
import { useFeatureFlag } from '/app/redux/config'
import { notifySubscribeAction } from '/app/redux/shell'
import { appShellListener } from '/app/redux/shell/remote'

import type { UseQueryOptions } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { NotifyResponseData, NotifyTopic } from '/app/redux/shell/types'

export interface QueryOptionsWithPolling<
  TData,
  TError = Error,
> extends UseQueryOptions<TData, TError> {
  forceHttpPolling?: boolean
}

interface UseNotifyDataReadyProps<TData, TError = Error> {
  topic: NotifyTopic
  options: QueryOptionsWithPolling<TData, TError>
  hostOverride?: HostConfig | null
}

interface UseNotifyDataReadyResults<TData, TError> {
  /* React Query options with notification-specific logic. */
  queryOptionsNotify: QueryOptionsWithPolling<TData, TError>

  /* Increments each time the shell indicates the server has new data ready. */
  refetch: number
}

// React query hooks perform refetches when instructed by the shell via a refetch mechanism, which useNotifyDataReady manages.
// `refetch` counts incoming refetch notifications, and consumers refetch whenever the count changes.
// 0 means the shell has not requested an HTTP refetch yet, so don't execute one.
// Counting rather than flagging keeps consecutive notifications from collapsing into a single refetch
// when one arrives while an HTTP refetch is already in flight.
//
// Eagerly assume notifications are enabled unless specified by the client via React Query options or by the shell via errors.
export function useNotifyDataReady<TData, TError = Error>({
  topic,
  options,
  hostOverride,
}: UseNotifyDataReadyProps<TData, TError>): UseNotifyDataReadyResults<
  TData,
  TError
> {
  const dispatch = useDispatch()
  const hostFromProvider = useHost()
  const host = hostOverride ?? hostFromProvider
  const hostname = host?.hostname ?? null
  const doTrackEvent = useTrackEvent()
  const forcePollingFF = useFeatureFlag('forceHttpPolling')
  const seenHostname = useRef<string | null>(null)
  const [refetch, setRefetch] = useState(0)

  const [
    hasEncounteredNotificationsError,
    setHasEncounteredNotificationsError,
  ] = useState(false)

  const { enabled, staleTime, forceHttpPolling } = options

  const shouldUseNotifications =
    !forceHttpPolling &&
    enabled !== false &&
    hostname != null &&
    staleTime !== Infinity &&
    !forcePollingFF

  useEffect(
    () => {
      if (shouldUseNotifications) {
        // Always fetch on initial mount to keep latency as low as possible.
        setRefetch(refetch => refetch + 1)
        appShellListener({
          hostname,
          notifyTopic: topic,
          callback: onDataEvent,
        })
        dispatch(notifySubscribeAction(hostname, topic))
        seenHostname.current = hostname
      }

      return () => {
        if (seenHostname.current != null) {
          appShellListener({
            hostname: seenHostname.current,
            notifyTopic: topic,
            callback: onDataEvent,
            isDismounting: true,
          })
        }
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topic, hostname, shouldUseNotifications]
  )

  const onDataEvent = useCallback(
    (data: NotifyResponseData): void => {
      if (data === 'ECONNFAILED' || data === 'ECONNREFUSED') {
        setHasEncounteredNotificationsError(true)
        if (data === 'ECONNREFUSED') {
          doTrackEvent({
            name: ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
            properties: {},
          })
        }
      } else if ('refetch' in data || 'unsubscribe' in data) {
        setRefetch(currentRefetch => currentRefetch + 1)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const isNotifyEnabled =
    shouldUseNotifications && !hasEncounteredNotificationsError
  const queryOptionsNotify = {
    ...options,
    refetchInterval: isNotifyEnabled ? false : options.refetchInterval,
  }

  return {
    queryOptionsNotify,
    refetch,
  }
}
