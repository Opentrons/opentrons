import * as React from 'react'
import { useQueryClient } from 'react-query'

import { useHost } from '@opentrons/react-api-client'
import { useNotifyService } from '../useNotifyService'

import { useLastRunCommandKey } from '../../organisms/Devices/hooks/useLastRunCommandKey'

import type { CommandsData } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'

export function useNotifyLastRunCommandKey(
  runId: string,
  options?: QueryOptionsWithPolling<CommandsData, Error>
): string | null {
  const host = useHost()
  const queryClient = useQueryClient()
  const [refetchUsingHTTP, setRefetchUsingHTTP] = React.useState(true)
  const queryKey = [host, 'maintenance_runs', 'current_run']

  const { isNotifyError } = useNotifyService<CommandsData>({
    topic: 'robot-server/runs/current_command',
    queryKey,
    refetchUsingHTTP: () => setRefetchUsingHTTP(true),
    options: options != null ? options : {},
  })

  const isNotifyEnabled = !isNotifyError && !options?.forceHttpPolling
  if (!isNotifyEnabled && !refetchUsingHTTP) setRefetchUsingHTTP(true)
  const isHTTPEnabled = options?.enabled !== false && refetchUsingHTTP

  const httpResponse = useLastRunCommandKey(runId, {
    ...options,
    enabled: isHTTPEnabled,
    onSettled: isNotifyEnabled ? () => setRefetchUsingHTTP(false) : undefined,
  })

  const currentCachedResponse =
    queryClient.getQueryData<string | null>(queryKey) ?? null

  if (httpResponse !== currentCachedResponse) {
    queryClient.setQueryData(queryKey, httpResponse)
  }
  const httpResponseData =
    queryClient.getQueryData<string | null>(queryKey) ?? null

  return httpResponseData
}
