import { restart } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HostConfig, RestartResponse } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export type UseRestartMutationResult = UseMutationResult<
  RestartResponse,
  AxiosError,
  void
> & {
  restart: UseMutateFunction<RestartResponse, AxiosError, void>
}

export type UseRestartMutationOptions = UseMutationOptions<
  RestartResponse,
  AxiosError,
  void
>

export function useRestartMutation(
  documentationState: DocumentationState,
  options: UseRestartMutationOptions = {},
  hostOverride?: HostConfig | null
): UseRestartMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useDocumentedMutation<RestartResponse, AxiosError>(
    documentationState,
    ['restart_robot'],
    ({ userNotes }) =>
      restart(host!, userNotes).then(response => response.data),
    options
  )

  return {
    ...mutation,
    restart: mutation.mutate,
  }
}
