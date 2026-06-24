import { useMutation } from 'react-query'

import { patchAuthSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AuthSettingsResponse,
  PatchAuthSettingsRequest,
} from '@opentrons/api-client'

export type UseAuthSettingsMutationResult = UseMutationResult<
  AuthSettingsResponse,
  AxiosError,
  PatchAuthSettingsRequest
> & {
  patchAuthSettings: UseMutateFunction<
    AuthSettingsResponse,
    AxiosError,
    PatchAuthSettingsRequest
  >
}

export function useAuthSettingsMutation(
  options: UseMutationOptions<
    AuthSettingsResponse,
    AxiosError,
    PatchAuthSettingsRequest
  > = {}
): UseAuthSettingsMutationResult {
  const host = useHost()
  const mutation = useMutation(
    getQueryKey(host, 'auth', 'settings'),
    (body: PatchAuthSettingsRequest) =>
      patchAuthSettings(host!, body)
        .then(response => response.data)
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
