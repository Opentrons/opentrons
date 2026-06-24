import { useMutation } from 'react-query'

import { patchAccessControlSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AccessControlAppSettingsResponse,
  PatchAccessControlSettingsRequest,
} from '@opentrons/api-client'

export type UsePatchAccessControlSettingsMutationResult = UseMutationResult<
  AccessControlAppSettingsResponse,
  AxiosError,
  PatchAccessControlSettingsRequest
> & {
  patchAccessControlSettings: UseMutateAsyncFunction<
    AccessControlAppSettingsResponse,
    AxiosError,
    PatchAccessControlSettingsRequest
  >
}

export function usePatchAccessControlSettingsMutation(
  options: UseMutationOptions<
    AccessControlAppSettingsResponse,
    AxiosError,
    PatchAccessControlSettingsRequest
  > = {}
): UsePatchAccessControlSettingsMutationResult {
  const host = useHost()

  const mutation = useMutation<
    AccessControlAppSettingsResponse,
    AxiosError,
    PatchAccessControlSettingsRequest
  >(
    getQueryKey(host, 'accessControl', 'settings', 'patch'),
    (body: PatchAccessControlSettingsRequest) =>
      patchAccessControlSettings(host!, body)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    patchAccessControlSettings: mutation.mutateAsync,
  }
}
