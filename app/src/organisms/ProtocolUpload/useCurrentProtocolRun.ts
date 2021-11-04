import * as React from 'react'
import {
  useCreateProtocolMutation,
  useProtocolQuery,
  useCreateRunMutation,
  useDeleteRunMutation,
  useRunQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'

const CONFLICTING_RECORD_STATUS_CODE = 409

export function useCurrentProtocolRun() {
  // TODO: IMMEDIATELY as soon as client data current run endpoint
  // exists on the robot, we should query/mutate that state rather than
  // storing this runId in react state
  // const { data: currentRunId } = useCurrentRunIdQuery()
  const [runId, setRunId] = React.useState<string | null>(null)
  const { data: allRuns } = useAllRunsQuery()

  // const { patchCurrentRunId } = usePatchCurrentRunId()
  const { deleteRun } = useDeleteRunMutation()
  const { createRun } = useCreateRunMutation({
    onError: error => {
      if (
        error?.response?.status === CONFLICTING_RECORD_STATUS_CODE &&
        allRuns != null
      ) {
        deleteRun(allRuns.data[0].id)
      }
    },
    onSuccess: data => {
      // patchCurrentRunId(data.data.id)
      setRunId(data.data.id)
    },
  })
  const { createProtocol: createProtocolRun } = useCreateProtocolMutation({
    onSuccess: data => {
      createRun({
        runType: 'protocol',
        createParams: {
          protocolId: data.data.id,
        },
      })
    },
  })

  const { data: runData } = useRunQuery(runId)
  const { data: protocolData } = useProtocolQuery(
    (runData?.data?.createParams?.protocolId as string) ?? null
  )

  console.table({ createProtocolRun, protocolData, runData })
  return { createProtocolRun, protocolData, runData }
}
