import * as React from 'react'

import { useNotifyService } from '../useNotifyService'
import { useLastRunCommand } from '../../organisms/Devices/hooks/useLastRunCommand'

import type { CommandsData, RunCommandSummary } from '@opentrons/api-client'
import type {
  QueryOptionsWithPolling,
  HTTPRefetchFrequency,
} from '../useNotifyService'

export function useNotifyLastRunCommand(
  runId: string,
  options: QueryOptionsWithPolling<CommandsData, Error> = {}
): RunCommandSummary | null {
  const [refetch, setRefetch] = React.useState<HTTPRefetchFrequency>(null)

  useNotifyService({
    topic: 'robot-server/runs/current_command',
    setRefetch,
    options,
  })

  const httpResponse = useLastRunCommand(runId, {
    ...options,
    enabled: options?.enabled !== false && refetch != null,
    onSettled: refetch === 'once' ? () => setRefetch(null) : () => null,
  })

  return httpResponse
}
