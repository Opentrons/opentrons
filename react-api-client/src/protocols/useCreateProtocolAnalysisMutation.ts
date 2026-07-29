import { useMutation, useQueryClient } from 'react-query'

import { createProtocolAnalysis } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  ErrorResponse,
  HostConfig,
  ProtocolAnalysisSummaryResult,
  RunTimeParameterFilesCreateData,
  RunTimeParameterValuesCreateData,
} from '@opentrons/api-client'

export interface CreateProtocolAnalysisVariables {
  protocolKey: string
  runTimeParameterValues?: RunTimeParameterValuesCreateData
  runTimeParameterFiles?: RunTimeParameterFilesCreateData
  forceReAnalyze?: boolean
}
export type UseCreateProtocolMutationResult = UseMutationResult<
  ProtocolAnalysisSummaryResult,
  AxiosError<ErrorResponse>,
  CreateProtocolAnalysisVariables
> & {
  createProtocolAnalysis: UseMutateFunction<
    ProtocolAnalysisSummaryResult,
    AxiosError<ErrorResponse>,
    CreateProtocolAnalysisVariables
  >
}

export type UseCreateProtocolAnalysisMutationOptions = UseMutationOptions<
  ProtocolAnalysisSummaryResult,
  AxiosError<ErrorResponse>,
  CreateProtocolAnalysisVariables
>

export function useCreateProtocolAnalysisMutation(
  protocolId: string | null,
  hostOverride?: HostConfig | null,
  options: UseCreateProtocolAnalysisMutationOptions | undefined = {}
): UseCreateProtocolMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()
  // Protocol analysis endpoint, does not require documentation.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation<
    ProtocolAnalysisSummaryResult,
    AxiosError<ErrorResponse>,
    CreateProtocolAnalysisVariables
  >(
    getQueryKey(host, 'protocols', protocolId, 'analyses'),
    async ({
      protocolKey,
      runTimeParameterValues,
      runTimeParameterFiles,
      forceReAnalyze,
    }) => {
      const response = await createProtocolAnalysis(
        host!,
        protocolKey,
        runTimeParameterValues,
        runTimeParameterFiles,
        forceReAnalyze
      )
      // Note: Not awaiting invalidateQueries() to preserve prior behavior.
      // Not sure this is what we actually want.
      void queryClient.invalidateQueries(getQueryKey(host, 'protocols'))
      return response.data
    },
    options
  )
  return {
    ...mutation,
    createProtocolAnalysis: mutation.mutate,
  }
}
