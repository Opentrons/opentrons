import {
  useDeleteRunMutation,
  useAllRunsQuery,
  useStopRunMutation,
} from '@opentrons/react-api-client'

export function useCloseProtocolRun(): () => void {
  // TODO: IMMEDIATELY as soon as client data current run endpoint
  // exists on the robot, we should patch that value to null here
  const { data: allRuns } = useAllRunsQuery()

  // const { patchCurrentRunId } = usePatchCurrentRunId()
  const { deleteRun } = useDeleteRunMutation()
  const { stopRun } = useStopRunMutation({
    onSuccess: _data => {
      if (allRuns != null) {
        const runId = allRuns.data[0].id
        deleteRun(runId)
      }
    },
  })

  return () => {
    if (allRuns != null && allRuns.data.length > 0) {
      stopRun(allRuns.data[0].id)
    }
  }
}
