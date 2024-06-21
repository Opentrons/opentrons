import { useNotifyAllCommandsQuery } from '../../../resources/runs'

import type { UseQueryOptions } from 'react-query'
import type {
  CommandsData,
  RunCommandSummary,
  GetCommandsParams,
} from '@opentrons/api-client'

const REFETCH_INTERVAL = 3000

export function useRunCommands(
  runId: string | null,
  params?: GetCommandsParams,
  options?: UseQueryOptions<CommandsData>
): RunCommandSummary[] | null {
  const { data: commandsData } = useNotifyAllCommandsQuery(runId, params, {
    refetchInterval: REFETCH_INTERVAL,
    ...options,
  })

  return commandsData?.data ?? null
}
