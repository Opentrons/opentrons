import { useNavigate } from 'react-router-dom'
import { useRunControls } from '/app/organisms/RunTimeControl'

import type { Run } from '@opentrons/api-client'
import type { RunControls } from '/app/organisms/RunTimeControl'

// Provides desktop run controls, routing the user to the run preview tab after a "run again" action.
export function useRunHeaderRunControls(
  runId: string,
  robotName: string
): RunControls {
  const navigate = useNavigate()

  function handleRunReset(createRunResponse: Run): void {
    navigate(
      `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-preview`
    )
  }
  return useRunControls(runId, handleRunReset)
}
