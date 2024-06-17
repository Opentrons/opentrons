import last from 'lodash/last'

import { useCommandQuery } from '@opentrons/react-api-client'

import type { CommandsData, RunCommandSummary } from '@opentrons/api-client'

// Return the last run command is not a "fixit" command. If it is a "fixit" command,
// return the command that failed (ie, the last run command without a fixit intent).
export function useLastRunCommandNoFixit(
  runId: string,
  commandsData: CommandsData | null
): RunCommandSummary | null {
  const lastRunCommand = last(commandsData?.data) ?? null

  const isFixitIntent =
    lastRunCommand != null && lastRunCommand.intent === 'fixit'

  // Get the failed command from the fixit command.
  const lastRunCommandActual = useCommandQuery(
    runId,
    lastRunCommand?.failedCommandId ?? null,
    {
      enabled: isFixitIntent,
    }
  )

  return isFixitIntent
    ? lastRunCommandActual.data?.data ?? null
    : lastRunCommand ?? null
}
