import {
  UseMutationResult,
  UseMutationOptions,
  useMutation,
  UseMutateFunction,
  useQueryClient,
} from 'react-query'
import { createProtocolAnalysis } from '@opentrons/api-client'
import { useHost } from '../api'
import type { AxiosError } from 'axios'
import type {
  ErrorResponse,
  HostConfig,
  Protocol,
  RunTimeParameterCreateData,
} from '@opentrons/api-client'

export interface CreateProtocolAnalysisVariables {
  protocolKey: string
  runTimeParameterValues?: RunTimeParameterCreateData
  forceReAnalyze?: boolean
}
export type UseCreateProtocolMutationResult = UseMutationResult<
  Protocol,
  AxiosError<ErrorResponse>,
  CreateProtocolAnalysisVariables
> & {
  createProtocolAnalysis: UseMutateFunction<
    Protocol,
    AxiosError<ErrorResponse>,
    CreateProtocolAnalysisVariables
  >
}

export type UseCreateProtocolMutationOptions = UseMutationOptions<
  Protocol,
  AxiosError<ErrorResponse>,
  CreateProtocolAnalysisVariables
>

export function useCreateProtocolAnalysisMutation(
  options: UseCreateProtocolMutationOptions = {},
  protocolId: string | null,
  hostOverride?: HostConfig | null
): UseCreateProtocolMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useMutation<
    Protocol,
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
          const protocolId = response.data.data.id
          queryClient
            .invalidateQueries([host, 'protocols'])
            .then(() =>
              queryClient.setQueryData(
                [host, 'protocols', protocolId],
                response.data
              )
            )
            .catch(e => {
              throw e
            })
          return response.data
        })
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    createProtocolAnalysis: mutation.mutate,
  }
}
