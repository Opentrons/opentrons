import type {
  CommandsData,
  RunCommandSummary,
  GetCommandsParams,
} from '@opentrons/api-client'
import { useAllCommandsQuery } from '@opentrons/react-api-client'
import type { UseQueryOptions } from 'react-query'

const REFETCH_INTERVAL = 3000

export function useRunCommands(
  runId: string | null,
  params?: GetCommandsParams,
  options?: UseQueryOptions<CommandsData>
): RunCommandSummary[] | null {
  const { data: commandsData } = useAllCommandsQuery(runId, params, {
    refetchInterval: REFETCH_INTERVAL,
    ...options,
  })

  return commandsData?.data ?? null
}
