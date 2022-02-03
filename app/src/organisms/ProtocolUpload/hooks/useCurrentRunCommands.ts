import { useAllCommandsQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from './useCurrentRunId'
import type { UseQueryOptions } from 'react-query'
import type {
  CommandsData,
  RunCommandSummary,
  GetCommandsParams,
} from '@opentrons/api-client'

const REFETCH_INTERVAL = 3000

export function useCurrentRunCommands(
  params?: GetCommandsParams,
  options?: UseQueryOptions<CommandsData>
): RunCommandSummary[] | null {
  const currentRunId = useCurrentRunId()
  const { data: commandsData } = useAllCommandsQuery(currentRunId, params, {
    refetchInterval: REFETCH_INTERVAL,
    ...options,
  })

  return commandsData?.data ?? null
}
