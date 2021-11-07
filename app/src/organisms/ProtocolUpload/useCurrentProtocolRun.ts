import * as React from 'react'
import { UseMutateFunction, useQueryClient } from 'react-query'
import { Protocol, Run } from '@opentrons/api-client'
import { useHost } from '../../../../react-api-client/src/api/useHost'
import {
  useCreateProtocolMutation,
  useProtocolQuery,
  useCreateRunMutation,
  useDeleteRunMutation,
  useRunQuery,
  useAllRunsQuery,
  useStopRunMutation,
} from '@opentrons/react-api-client'

const CONFLICTING_RECORD_STATUS_CODE = 409

interface UseCurrentProtocolRun {
  createProtocolRun: UseMutateFunction<Protocol, unknown, File[]>
  protocolRecord?: Protocol | null
  runRecord?: Run | null
}

export function useCurrentProtocolRun(): UseCurrentProtocolRun {
  // TODO: IMMEDIATELY as soon as client data current run endpoint
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
      console.log('ON ERROR')
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
