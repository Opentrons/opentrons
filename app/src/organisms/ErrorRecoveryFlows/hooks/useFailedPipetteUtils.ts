import { useRunCurrentState } from '@opentrons/react-api-client'

import type { NozzleLayoutValues } from '@opentrons/api-client'
import type { FailedCommand } from '../types'

export interface UseFailedPipetteUtilsResult {
  relevantActiveNozzleLayout: NozzleLayoutValues | null
}

export function useFailedPipetteUtils(
  runId: string,
  failedCommand: FailedCommand | null
): UseFailedPipetteUtilsResult {
  const failedPipetteId =
    failedCommand != null
      ? 'pipetteId' in failedCommand.params
        ? failedCommand.params.pipetteId
        : null
      : null

  const { data: runCurrentState } = useRunCurrentState(runId, {
    enabled: failedPipetteId != null,
  })

  return {
    relevantActiveNozzleLayout:
      runCurrentState?.data.activeNozzleLayouts[failedPipetteId] ?? null,
  }
}
