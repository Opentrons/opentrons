import { useCurrentRunId } from './useCurrentRunId'
import { useRunCommands } from './useRunCommands'
import type { UseQueryOptions } from 'react-query'
import type {
  CommandsData,
  RunCommandSummary,
  GetCommandsParams,
} from '@opentrons/api-client'

/**
 * A hook that retrieves the summary of commands for the currently selected run.
 *
 * @param {GetCommandsParams} [params] - Optional parameters to filter the commands.
 * @param {UseQueryOptions<CommandsData>} [options] - Optional options for the underlying `useQuery` hook.
 * @returns {RunCommandSummary[] | null} An array of `RunCommandSummary` objects, or null if the data is not available.
 */
export function useCurrentRunCommands(
  params?: GetCommandsParams,
  options?: UseQueryOptions<CommandsData>
): RunCommandSummary[] | null {
  const currentRunId = useCurrentRunId()

  return useRunCommands(currentRunId, params, options)
}
