import { useAllCommandsQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from './useCurrentRunId'

import type { RunCommandSummary } from '@opentrons/api-client'

const REFETCH_INTERVAL = 1000

export function useCurrentRunCommands(): RunCommandSummary[] | null {
  const currentRunId = useCurrentRunId()
  const { data: commandsData } = useAllCommandsQuery(currentRunId, {
    refetchInterval: REFETCH_INTERVAL,
  })

  return commandsData?.data ?? null
}
