import * as React from 'react'

import { useNotifyService } from '../useNotifyService'
import { useLastRunCommandKey } from '../../organisms/Devices/hooks/useLastRunCommandKey'

import type { CommandsData } from '@opentrons/api-client'
import type {
  QueryOptionsWithPolling,
  HTTPRefetchFrequency,
} from '../useNotifyService'

export function useNotifyLastRunCommandKey(
  runId: string,
  options: QueryOptionsWithPolling<CommandsData, Error> = {}
): string | null {
  const [refetch, setRefetch] = React.useState<HTTPRefetchFrequency>(null)

  useNotifyService({
    topic: 'robot-server/runs/current_command',
    setRefetch,
    options,
  })

  const httpResponse = useLastRunCommandKey(runId, {
    ...options,
    enabled: options?.enabled !== false && refetch != null,
    onSettled: refetch === 'once' ? () => setRefetch(null) : () => null,
  })

  return httpResponse
}
