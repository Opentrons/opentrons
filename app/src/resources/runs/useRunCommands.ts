import { useNotifyAllCommandsQuery } from './useNotifyAllCommandsQuery'

import type {
  CommandsData,
  GetRunCommandsParams,
  RunCommandSummary,
} from '@opentrons/api-client'
import type { UseQueryOptions } from 'react-query'

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
