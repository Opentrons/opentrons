import * as React from 'react'

import { useDispatch } from 'react-redux'

import { useHost } from '@opentrons/react-api-client'

import { appShellListener } from '../redux/shell/remote'
import { notifySubscribeAction, notifyUnsubscribeAction } from '../redux/shell'
import {
  useTrackEvent,
  ANALYTICS_NOTIFICATION_PORT_BLOCK_ERROR,
} from '../redux/analytics'
import { useIsFlex } from '../organisms/Devices/hooks/useIsFlex'

import type { UseQueryOptions } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'
import type { NotifyTopic, NotifyResponseData } from '../redux/shell/types'

export interface QueryOptionsWithPolling<TData, TError = Error>
  extends UseQueryOptions<TData, TError> {
  forceHttpPolling?: boolean
}

interface UseNotifyServiceProps<TData, TError = Error> {
  topic: NotifyTopic
  refetchUsingHTTP: () => void
  options: QueryOptionsWithPolling<TData, TError>
  hostOverride?: HostConfig | null
}

export function useNotifyService<TData, TError = Error>({
  topic,
  refetchUsingHTTP,
  options,
  hostOverride,
}: UseNotifyServiceProps<TData, TError>): { isNotifyError: boolean } {
  const dispatch = useDispatch()
  const hostFromProvider = useHost()
  const host = hostOverride ?? hostFromProvider
  const hostname = host?.hostname ?? null
  const doTrackEvent = useTrackEvent()
  const isFlex = useIsFlex(host?.robotName ?? '')
  const isNotifyError = React.useRef(false)
  const { enabled, staleTime, forceHttpPolling } = options

  React.useEffect(() => {
    // Always fetch on initial mount.
    refetchUsingHTTP()
    if (
      !forceHttpPolling &&
      enabled !== false &&
      hostname != null &&
      staleTime !== Infinity
    ) {
      appShellListener(hostname, topic, onDataEvent)
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
        // TODO(jh 2023-02-23): remove the robot type check once OT-2s support MQTT.
        if (data === 'ECONNREFUSED' && isFlex) {
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
