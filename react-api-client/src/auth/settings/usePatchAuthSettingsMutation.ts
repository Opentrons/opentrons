import { useMutation, useQueryClient } from 'react-query'

import { patchAuthSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AuthSettingsResponse,
  PatchAuthSettingsRequest,
} from '@opentrons/api-client'

export type UsePatchAuthSettingsMutationResult = UseMutationResult<
  AuthSettingsResponse,
  AxiosError,
  PatchAuthSettingsRequest
> & {
  patchAuthSettings: UseMutateAsyncFunction<
    AuthSettingsResponse,
    AxiosError,
    PatchAuthSettingsRequest
  >
}

export function usePatchAuthSettingsMutation(
  options: UseMutationOptions<
    AuthSettingsResponse,
    AxiosError,
    PatchAuthSettingsRequest
  > = {}
): UsePatchAuthSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    AuthSettingsResponse,
    AxiosError,
    PatchAuthSettingsRequest
  >(
    getQueryKey(host, 'auth', 'settings', 'patch'),
    (body: PatchAuthSettingsRequest) =>
      patchAuthSettings(host!, body)
        .then(response => {
          queryClient
            .invalidateQueries(getQueryKey(host, 'auth', 'settings'))
            .catch((e: Error) => {
              console.error(
                `error invalidating auth settings query: ${e.message}`
              )
            })
          return response.data
        })
        .catch((e: AxiosError) => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    patchAuthSettings: mutation.mutateAsync,
  }
}
