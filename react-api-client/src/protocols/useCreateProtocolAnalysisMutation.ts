import { useMutation, useQueryClient } from 'react-query'

import { createProtocolAnalysis } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  ErrorResponse,
  HostConfig,
  HttpClientError,
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
  HttpClientError<ErrorResponse>,
  CreateProtocolAnalysisVariables
> & {
  createProtocolAnalysis: UseMutateFunction<
    ProtocolAnalysisSummaryResult,
    HttpClientError<ErrorResponse>,
    CreateProtocolAnalysisVariables
  >
}

export type UseCreateProtocolAnalysisMutationOptions = UseMutationOptions<
  ProtocolAnalysisSummaryResult,
  HttpClientError<ErrorResponse>,
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

  const mutation = useMutation<
    ProtocolAnalysisSummaryResult,
    HttpClientError<ErrorResponse>,
    CreateProtocolAnalysisVariables
  >(
    [host, 'protocols', protocolId, 'analyses'],
    ({
      protocolKey,
      runTimeParameterValues,
      runTimeParameterFiles,
      forceReAnalyze,
    }) =>
      createProtocolAnalysis(
        host!,
        protocolKey,
        runTimeParameterValues,
        runTimeParameterFiles,
        forceReAnalyze
      )
        .then(response => {
          queryClient
            .invalidateQueries([host, 'protocols'])
            .catch((e: Error) => {
              throw e
            })
          return response.data
        })
        .catch((e: Error) => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    createProtocolAnalysis: mutation.mutate,
  }
}
