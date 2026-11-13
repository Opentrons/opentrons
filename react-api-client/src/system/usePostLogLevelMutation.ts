import { useQueryClient } from 'react-query'

import { postLogLevel } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'
import { logLevelQueryKey } from './useLogLevelQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  HostConfig,
  LogLevelPayload,
  LogLevels,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UsePostLogLevelMutationResult = UseMutationResult<
  LogLevelPayload,
  AxiosError,
  LogLevels
> & {
  postLogLevel: UseMutateFunction<LogLevelPayload, AxiosError, LogLevels>
}

export type UsePostLogLevelMutationOptions = UseMutationOptions<
  LogLevelPayload,
  AxiosError,
  LogLevels
>

export function usePostLogLevelMutation(
  documentationState: DocumentationState,
  options: UsePostLogLevelMutationOptions = {},
  hostOverride?: HostConfig | null
): UsePostLogLevelMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    LogLevelPayload,
    AxiosError,
    LogLevels
  >(
    documentationState,
    ['set_log_level'],
    ({
      variables: logLevel,
      userNotes,
    }: DocumentedMutationParameters<LogLevels>) =>
      postLogLevel(host!, logLevel, userNotes).then(response => {
        queryClient.setQueryData(logLevelQueryKey(host), response.data)
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    postLogLevel: mutation.mutate,
  }
}
