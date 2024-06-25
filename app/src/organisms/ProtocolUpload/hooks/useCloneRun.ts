import { useQueryClient } from 'react-query'

import {
  useHost,
  useCreateRunMutation,
  useCreateProtocolAnalysisMutation,
} from '@opentrons/react-api-client'
import { useNotifyRunQuery } from '../../../resources/runs'
import { getRunTimeParameterValuesForRun } from '../../Devices/utils'

import type { Run } from '@opentrons/api-client'

interface UseCloneRunResult {
  cloneRun: () => void
  isLoading: boolean
}

export function useCloneRun(
  runId: string | null,
  onSuccessCallback?: (createRunResponse: Run) => unknown,
  triggerAnalysis: boolean = false
): UseCloneRunResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const { data: runRecord } = useNotifyRunQuery(runId)
  const protocolKey = runRecord?.data.protocolId ?? null

  const { createRun, isLoading } = useCreateRunMutation({
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
      if (onSuccessCallback != null) onSuccessCallback(response)
    },
  })
  const { createProtocolAnalysis } = useCreateProtocolAnalysisMutation(
    protocolKey,
    host
  )
  const cloneRun = (): void => {
    if (runRecord != null) {
      const { protocolId, labwareOffsets, runTimeParameters } = runRecord.data
      const runTimeParameterValues = getRunTimeParameterValuesForRun(
        runTimeParameters
      )
      if (triggerAnalysis && protocolKey != null) {
        createProtocolAnalysis({ protocolKey, runTimeParameterValues })
      }
      createRun({ protocolId, labwareOffsets, runTimeParameterValues })
    } else {
      console.info('failed to clone run record, source run record not found')
    }
  }

  return { cloneRun, isLoading }
}
