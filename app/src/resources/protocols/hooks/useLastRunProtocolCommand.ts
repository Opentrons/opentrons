import last from 'lodash/last'

import { useCommandQuery } from '@opentrons/react-api-client'

import type { CommandsData, RunCommandSummary } from '@opentrons/api-client'

// Return the last command with a "protocol" intent. If the command does not have "protocol" intent,
// return the last command with "protocol" intent.
export function useLastRunProtocolCommand(
  runId: string,
  commandsData: CommandsData | null
): RunCommandSummary | null {
  const lastRunCommand = last(commandsData?.data) ?? null

  const isProtocolIntent = lastRunCommand?.intent === 'protocol'

  // Get the failed command from the fixit command.
  const lastRunCommandActual = useCommandQuery(
    runId,
    lastRunCommand?.failedCommandId ?? null,
    {
      enabled: !isProtocolIntent && lastRunCommand != null,
    }
  )

  return !isProtocolIntent && lastRunCommand != null
    ? lastRunCommandActual.data?.data ?? null
    : lastRunCommand ?? null
}
