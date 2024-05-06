import { useNotifyService } from '../useNotifyService'
import { useLastRunCommand } from '../../organisms/Devices/hooks/useLastRunCommand'

import type { CommandsData, RunCommandSummary } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../useNotifyService'

export function useNotifyLastRunCommand(
  runId: string,
  options: QueryOptionsWithPolling<CommandsData, Error> = {}
): RunCommandSummary | null {
  const { notifyOnSettled, isNotifyEnabled } = useNotifyService({
    topic: 'robot-server/runs/current_command',
    options,
  })

  const httpResponse = useLastRunCommand(runId, {
    ...options,
    enabled: options?.enabled !== false && isNotifyEnabled,
    onSettled: notifyOnSettled,
  })

  return httpResponse
}
