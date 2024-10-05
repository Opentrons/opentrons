import { useQueryClient } from 'react-query'

import {
  useHost,
  useCreateRunMutation,
  useCreateProtocolAnalysisMutation,
} from '@opentrons/react-api-client'
import { useNotifyRunQuery } from './useNotifyRunQuery'
import {
  getRunTimeParameterValuesForRun,
  getRunTimeParameterFilesForRun,
} from '/app/transformations/runs'

import type { Run } from '@opentrons/api-client'

interface UseCloneRunResult {
  cloneRun: () => void
  isLoadingRun: boolean
  isCloning: boolean
}

export function useCloneRun(
  runId: string | null,
  onSuccessCallback?: (createRunResponse: Run) => unknown,
  triggerAnalysis: boolean = false
): UseCloneRunResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const { data: runRecord, isLoading: isLoadingRun } = useNotifyRunQuery(runId)
  const protocolKey = runRecord?.data.protocolId ?? null
  const { createRun, isLoading: isCloning } = useCreateRunMutation({
    onSuccess: response => {
      const invalidateRuns = queryClient.invalidateQueries([host, 'runs'])
      const invalidateProtocols = queryClient.invalidateQueries([
        host,
        'protocols',
        protocolKey,
      ])
      Promise.all([invalidateRuns, invalidateProtocols]).catch((e: Error) => {
        console.error(`error invalidating runs query: ${e.message}`)
      })
      // The onSuccess callback is not awaited until query invalidation, because currently, in every instance this
      // onSuccessCallback is utilized, we only use it for navigating. We may need to revisit this.
      onSuccessCallback?.(response)
    },
  })
  const { createProtocolAnalysis } = useCreateProtocolAnalysisMutation(
    protocolKey,
    host
  )
  const cloneRun = (): void => {
    if (runRecord != null) {
      const { protocolId, labwareOffsets } = runRecord.data
      const runTimeParameters =
        'runTimeParameters' in runRecord.data
          ? runRecord.data.runTimeParameters
          : []
      const runTimeParameterValues = getRunTimeParameterValuesForRun(
        runTimeParameters
      )
      const runTimeParameterFiles = getRunTimeParameterFilesForRun(
        runTimeParameters
      )
      if (triggerAnalysis && protocolKey != null) {
        createProtocolAnalysis({
          protocolKey,
          runTimeParameterValues,
          runTimeParameterFiles,
        })
      }
      createRun({
        protocolId,
        labwareOffsets,
        runTimeParameterValues,
        runTimeParameterFiles,
      })
    } else {
      console.info('failed to clone run record, source run record not found')
    }
  }

  return { cloneRun, isLoadingRun, isCloning }
}
