import { createProtocolAnalysis } from '@opentrons/api-client'
import { useMutation, useQueryClient } from 'react-query'
import { useHost } from '../api'
import type {
  ErrorResponse,
  HostConfig,
  RunTimeParameterCreateData,
} from '@opentrons/api-client'
import type { ProtocolAnalysisSummary } from '@opentrons/shared-data'
import type { AxiosError } from 'axios'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'

export interface CreateProtocolAnalysisVariables {
  protocolKey: string
  runTimeParameterValues?: RunTimeParameterCreateData
  forceReAnalyze?: boolean
}
export type UseCreateProtocolMutationResult = UseMutationResult<
  ProtocolAnalysisSummary[],
  AxiosError<ErrorResponse>,
  CreateProtocolAnalysisVariables
> & {
  createProtocolAnalysis: UseMutateFunction<
    ProtocolAnalysisSummary[],
    AxiosError<ErrorResponse>,
    CreateProtocolAnalysisVariables
  >
}

export type UseCreateProtocolAnalysisMutationOptions = UseMutationOptions<
  ProtocolAnalysisSummary[],
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

  const mutation = useMutation<
    ProtocolAnalysisSummary[],
    AxiosError<ErrorResponse>,
    CreateProtocolAnalysisVariables
  >(
    [host, 'protocols', protocolId, 'analyses'],
    ({ protocolKey, runTimeParameterValues, forceReAnalyze }) =>
      createProtocolAnalysis(
        host as HostConfig,
        protocolKey,
        runTimeParameterValues,
        forceReAnalyze
      )
        .then(response => {
          queryClient
            .invalidateQueries([host, 'protocols', protocolId, 'analyses'])
            .then(() =>
              queryClient.setQueryData(
                [host, 'protocols', protocolId, 'analyses'],
                response.data
              )
            )
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
