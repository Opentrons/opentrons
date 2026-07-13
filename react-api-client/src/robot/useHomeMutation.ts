import { home } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HomeData, HomeResponse, HostConfig } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export type UseHomeMutationResult = UseMutationResult<
  HomeResponse,
  AxiosError,
  HomeData
> & {
  home: UseMutateFunction<HomeResponse, AxiosError, HomeData>
}

export type UseHomeMutationOptions = UseMutationOptions<
  HomeResponse,
  AxiosError,
  HomeData
>

export function useHomeMutation(
  documentationState: DocumentationState,
  options: UseHomeMutationOptions = {},
  hostOverride?: HostConfig | null
): UseHomeMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const mutation = useDocumentedMutation<HomeResponse, AxiosError, HomeData>(
    documentationState,
    ['home_robot'],
    getQueryKey(host, 'robot', 'home'),
    ({ variables: homeData, userNotes }) =>
      home(host!, homeData, userNotes).then(response => response.data),
    options
  )
  return {
    ...mutation,
    home: mutation.mutate,
  }
}
