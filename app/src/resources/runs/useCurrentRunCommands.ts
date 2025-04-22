import { useCurrentRunId, useRunCommands } from '/app/resources/runs'

import type {
  CommandsData,
  GetRunCommandsParams,
  RunCommandSummary,
} from '@opentrons/api-client'
import type { UseQueryOptions } from 'react-query'

export function useCurrentRunCommands(
  params?: GetRunCommandsParams,
  options?: UseQueryOptions<CommandsData>
): RunCommandSummary[] | null {
  const currentRunId = useCurrentRunId()

  return useRunCommands(currentRunId, params, options)
}
