import * as React from 'react'
import { useQueryClient, UseMutateFunction } from 'react-query'
import {
  useHost,
  useCreateProtocolMutation,
  useProtocolQuery,
  useCreateRunMutation,
  useDeleteRunMutation,
  useRunQuery,
  useAllRunsQuery,
  useStopRunMutation,
} from '@opentrons/react-api-client'
import type { Protocol, Run } from '@opentrons/api-client'

const CONFLICTING_RECORD_STATUS_CODE = 409

interface UseCurrentProtocolRun {
  createProtocolRun: UseMutateFunction<Protocol, unknown, File[], unknown>
  protocolRecord: Protocol | null | undefined
  runRecord: Run | null | undefined
}

export function useCurrentProtocolRun(): UseCurrentProtocolRun {
  // TODO: IMMEDIATELY as soon as GET /runs links.current pointer path exists
  // exists on the robot, we should query/mutate that state rather than
  // storing this runId in react state
  // const { data: currentRunId } = useCurrentRunIdQuery()
  const host = useHost()
  const queryClient = useQueryClient()
  const [protocolId, setProtocolId] = React.useState<string | null>(null)
  const [runId, setRunId] = React.useState<string | null>(null)
  const { data: allRuns } = useAllRunsQuery()
  const { data: runRecord } = useRunQuery(runId, {
    onError: _data => {
      setRunId(null)
    },
  })
  const { data: protocolRecord } = useProtocolQuery(
    (runRecord?.data?.createParams?.protocolId as string) ?? null
  )

  // const { patchCurrentRunId } = usePatchCurrentRunId()
  const { stopRun } = useStopRunMutation({
    onSuccess: _data => {
      if (allRuns != null) {
        deleteRun(allRuns.data[0].id)
      }
    },
  })
  const { deleteRun } = useDeleteRunMutation({
    onSuccess: _data => {
      if (protocolId != null) {
        createRun({
          runType: 'protocol',
          createParams: {
            protocolId: protocolId,
          },
        })
      }
    },
  })
  const { createRun } = useCreateRunMutation({
    onError: error => {
      if (
        error?.response?.status === CONFLICTING_RECORD_STATUS_CODE &&
        allRuns != null
      ) {
        stopRun(allRuns.data[0].id)
        queryClient
          .invalidateQueries([host, 'runs'])
          .catch((e: Error) =>
            console.error(`error invalidating runs query: ${e.message}`)
          )
      }
    },
    onSuccess: data => {
      // patchCurrentRunId(data.data.id)
      queryClient
        .invalidateQueries([host, 'runs'])
        .catch((e: Error) =>
          console.error(`error invalidating runs query: ${e.message}`)
        )
      setRunId(data.data.id)
    },
  })
  const { createProtocol: createProtocolRun } = useCreateProtocolMutation({
    onSuccess: data => {
      setProtocolId(data.data.id)
      createRun({
        runType: 'protocol',
        createParams: {
          protocolId: data.data.id,
        },
      })
    },
  })

  return {
    createProtocolRun,
    protocolRecord,
    runRecord,
  }
}
