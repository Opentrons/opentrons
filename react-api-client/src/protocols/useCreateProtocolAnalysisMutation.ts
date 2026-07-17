import { useQueryClient } from 'react-query'

import { createProtocolAnalysis } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
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
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

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
  documentationState: DocumentationState,
  protocolId: string | null,
  hostOverride?: HostConfig | null,
  options: UseCreateProtocolAnalysisMutationOptions | undefined = {}
): UseCreateProtocolMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    ProtocolAnalysisSummaryResult,
    AxiosError<ErrorResponse>,
    CreateProtocolAnalysisVariables
  >(
    documentationState,
    ['create_protocol_analysis'],
    getQueryKey(host, 'protocols', protocolId, 'analyses'),
    ({
      variables: {
        protocolKey,
        runTimeParameterValues,
        runTimeParameterFiles,
        forceReAnalyze,
      },
      userNotes,
    }: DocumentedMutationParameters<CreateProtocolAnalysisVariables>) =>
      createProtocolAnalysis(
        host!,
        protocolKey,
        runTimeParameterValues,
        runTimeParameterFiles,
        forceReAnalyze,
        userNotes
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
