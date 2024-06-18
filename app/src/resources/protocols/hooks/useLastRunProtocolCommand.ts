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

  // Not all protocol commands specify a protocol intent.
  // If intent is undefined during a run, we can assume the intent is protocol.
  const isProtocolIntent =
    lastRunCommand != null &&
    (lastRunCommand.intent != null
      ? lastRunCommand.intent === 'protocol'
      : true)

  // Get the failed command from the non-protocol command.
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
