import { useMutation } from 'react-query'

import { home } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HomeData, HomeResponse, HostConfig } from '@opentrons/api-client'

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
  options: UseHomeMutationOptions = {},
  hostOverride?: HostConfig | null
): UseHomeMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const mutation = useMutation<HomeResponse, AxiosError, HomeData>(
    getQueryKey(host, 'robot', 'home'),
    homeData => home(host!, homeData).then(response => response.data),
    options
  )
  return {
    ...mutation,
    home: mutation.mutate,
  }
}
