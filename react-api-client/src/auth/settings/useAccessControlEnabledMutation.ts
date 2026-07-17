import { useMutation } from 'react-query'

import { patchAccessControlEnabled } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AccessControlEnabledSettingsResponse,
  PatchAccessControlEnabledSettingsRequest,
} from '@opentrons/api-client'

export type UseAccessControlEnabledMutationResult = UseMutationResult<
  AccessControlEnabledSettingsResponse,
  AxiosError,
  PatchAccessControlEnabledSettingsRequest
> & {
  patchAccessControlEnabledSettings: UseMutateFunction<
    AccessControlEnabledSettingsResponse,
    AxiosError,
    PatchAccessControlEnabledSettingsRequest
  >
}

export function useAccessControlEnabledMutation(
  options: UseMutationOptions<
    AccessControlEnabledSettingsResponse,
    AxiosError,
    PatchAccessControlEnabledSettingsRequest
  > = {}
): UseAccessControlEnabledMutationResult {
  const host = useHost()
  const mutation = useMutation(
    getQueryKey(host, 'auth', 'settings', 'accessControlEnabled'),
    (body: PatchAccessControlEnabledSettingsRequest) =>
      patchAccessControlEnabled(host!, body)
        .then(response => response.data)
        .catch((e: AxiosError) => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    patchAccessControlEnabledSettings: mutation.mutateAsync,
  }
}
