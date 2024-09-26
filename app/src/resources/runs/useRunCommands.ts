import { useNotifyAllCommandsQuery } from './useNotifyAllCommandsQuery'

import type { UseQueryOptions } from 'react-query'
import type {
  CommandsData,
  RunCommandSummary,
  GetRunCommandsParams,
} from '@opentrons/api-client'

const REFETCH_INTERVAL = 3000

export function useRunCommands(
  runId: string | null,
  params?: GetRunCommandsParams,
  options?: UseQueryOptions<CommandsData>
): RunCommandSummary[] | null {
  const { data: commandsData } = useNotifyAllCommandsQuery(runId, params, {
    refetchInterval: REFETCH_INTERVAL,
    ...options,
  })

  return commandsData?.data ?? null
}
