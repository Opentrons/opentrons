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
            .invalidateQueries(getQueryKey(host, 'protocols'))
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
