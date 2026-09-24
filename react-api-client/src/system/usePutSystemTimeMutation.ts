import { useQueryClient } from 'react-query'

import { putSystemTime } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'
import { systemTimeQueryKey } from './useSystemTimeQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HostConfig, SystemTimeResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UsePutSystemTimeMutationResult = UseMutationResult<
  SystemTimeResponse,
  AxiosError,
  string
> & {
  putSystemTime: UseMutateFunction<SystemTimeResponse, AxiosError, string>
}

export type UsePutSystemTimeMutationOptions = UseMutationOptions<
  SystemTimeResponse,
  AxiosError,
  string
>

export function usePutSystemTimeMutation(
  documentationState: DocumentationState,
  options: UsePutSystemTimeMutationOptions = {},
  hostOverride?: HostConfig | null
): UsePutSystemTimeMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    SystemTimeResponse,
    AxiosError,
    string
  >(
    documentationState,
    ['sync_system_time'],
    ({
      variables: systemTime,
      userNotes,
    }: DocumentedMutationParameters<string>) =>
      putSystemTime(host!, systemTime, userNotes).then(response => {
        queryClient.setQueryData(systemTimeQueryKey(host), response.data)
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    putSystemTime: mutation.mutate,
  }
}
