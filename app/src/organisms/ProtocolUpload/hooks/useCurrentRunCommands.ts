import { useCurrentRunId, useRunCommands } from '/app/resources/runs'
import type { UseQueryOptions } from 'react-query'
import type {
  CommandsData,
  RunCommandSummary,
  GetRunCommandsParams,
} from '@opentrons/api-client'

export function useCurrentRunCommands(
  params?: GetRunCommandsParams,
  options?: UseQueryOptions<CommandsData>
): RunCommandSummary[] | null {
  const currentRunId = useCurrentRunId()

  return useRunCommands(currentRunId, params, options)
}
