import { useQueryClient } from 'react-query'
import {
  useDeleteRunMutation,
  useAllRunsQuery,
  useStopRunMutation,
  useHost,
} from '@opentrons/react-api-client'

export function useCloseProtocolRun() {
  // TODO: IMMEDIATELY as soon as client data current run endpoint
  // exists on the robot, we should patch that value to null here
  const { data: allRuns } = useAllRunsQuery()
  const queryClient = useQueryClient()
  const host = useHost()

  // const { patchCurrentRunId } = usePatchCurrentRunId()
  const { deleteRun } = useDeleteRunMutation()
  const { stopRun } = useStopRunMutation({
    onSuccess: _data => {
      if (allRuns != null) {
        const runId = allRuns.data[0].id
        deleteRun(runId)
        queryClient.removeQueries([host, 'runs', runId])
      }
    },
  })

  return () => {
    console.log('IN DELETE From X', allRuns)
    if (allRuns != null && allRuns.data.length > 0) {
      stopRun(allRuns.data[0].id)
    }
  }
}
