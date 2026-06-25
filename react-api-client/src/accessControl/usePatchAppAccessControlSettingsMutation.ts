import { useMutation } from 'react-query'

import { patchAppAccessControlSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AccessControlAppSettingsResponse,
  PatchAppAccessControlSettingsRequest,
} from '@opentrons/api-client'

export type UsePatchAppAccessControlSettingsMutationResult = UseMutationResult<
  AccessControlAppSettingsResponse,
  AxiosError,
  PatchAppAccessControlSettingsRequest
> & {
  patchAppAccessControlSettings: UseMutateAsyncFunction<
    AccessControlAppSettingsResponse,
    AxiosError,
    PatchAppAccessControlSettingsRequest
  >
}

export function usePatchAppAccessControlSettingsMutation(
  options: UseMutationOptions<
    AccessControlAppSettingsResponse,
    AxiosError,
    PatchAppAccessControlSettingsRequest
  > = {}
): UsePatchAppAccessControlSettingsMutationResult {
  const host = useHost()

  const mutation = useMutation<
    AccessControlAppSettingsResponse,
    AxiosError,
    PatchAppAccessControlSettingsRequest
  >(
    getQueryKey(host, 'accessControl', 'settings', 'patch'),
    (body: PatchAppAccessControlSettingsRequest) =>
      patchAppAccessControlSettings(host!, body)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    patchAppAccessControlSettings: mutation.mutateAsync,
  }
}
