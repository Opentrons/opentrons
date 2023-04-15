import { useAllCommandsQuery } from '@opentrons/react-api-client'
import type { UseQueryOptions } from 'react-query'
import type {
  CommandsData,
  RunCommandSummary,
  GetCommandsParams,
} from '@opentrons/api-client'

const REFETCH_INTERVAL = 3000

/**
 * A hook to get the summary of commands for a specific run.
 * @param {string | null} runId - The ID of the run to get the commands for.
 * @param {GetCommandsParams} [params] - Additional parameters for filtering the commands.
 * @param {UseQueryOptions<CommandsData>} [options] - Additional options for the useAllCommandsQuery hook.
 * @returns {RunCommandSummary[] | null} - An array of RunCommandSummary objects or null if there is no data.
 */
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
