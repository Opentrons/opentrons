import { RUN_STATUS_IDLE } from '@opentrons/api-client'

import { useCurrentRunStatus } from '../../../organisms/RunTimeControl/hooks'

export function useIsProtocolRunning(): boolean {
  const runStatus = useCurrentRunStatus()

  // may want to adjust the condition that shows the active run - only running, paused, etc
  const isProtocolRunning = runStatus != null && runStatus !== RUN_STATUS_IDLE

  return isProtocolRunning
}
