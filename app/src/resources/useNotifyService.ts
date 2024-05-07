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
<<<<<<< HEAD
=======
  const isFlex = useIsFlex(host?.robotName ?? '')
  const hasUsedNotifyService = React.useRef(false)
>>>>>>> 61be566d31 (fix(app): fix excessive /runs network requests (#14783))
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
<<<<<<< HEAD
      seenHostname.current = hostname
    } else {
      setRefetch('always')
    }

    return () => {
      if (seenHostname.current != null) {
=======
      hasUsedNotifyService.current = true
      seenHostname.current = hostname
    } else {
      setRefetch('always')
    }

    return () => {
      if (hasUsedNotifyService.current) {
>>>>>>> 1ba616651c (refactor(app-shell-odd): Utilize robot-server unsubscribe flags (#14724))
        appShellListener({
<<<<<<< HEAD
          hostname: seenHostname.current,
=======
          hostname: seenHostname.current as string,
>>>>>>> 61be566d31 (fix(app): fix excessive /runs network requests (#14783))
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
<<<<<<< HEAD
      if (data === 'ECONNREFUSED') {
=======
      // TODO(jh 2023-02-23): remove the robot type check once OT-2s support MQTT.
      if (data === 'ECONNREFUSED' && isFlex) {
>>>>>>> ef8db92660 (refactor(app, robot-server): Rename refetchUsingHTTP -> refetch (#14800))
        doTrackEvent({
          name: ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
          properties: {},
        })
      }
<<<<<<< HEAD
<<<<<<< HEAD
    } else if ('refetch' in data || 'unsubscribe' in data) {
      setRefetch('once')
=======
    } else if ('refetchUsingHTTP' in data || 'unsubscribe' in data) {
      setRefetchUsingHTTP('once')
>>>>>>> fbfa607dac (refactor(app-shell, app-shell-odd): Refactor app to use unsubscribe flags (#14640))
=======
    } else if ('refetch' in data || 'unsubscribe' in data) {
      setRefetch('once')
>>>>>>> ef8db92660 (refactor(app, robot-server): Rename refetchUsingHTTP -> refetch (#14800))
    }
  }, [])

  const notifyOnSettled = React.useCallback(() => {
    if (refetch === 'once') {
      setRefetch(null)
    }
  }, [refetch])

  return { notifyOnSettled, isNotifyEnabled: refetch != null }
}
