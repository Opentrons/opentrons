import { useMutation, useQueryClient } from 'react-query'

import { patchAccessControlEnabled } from '@opentrons/api-client'

import { useHost } from '../../api'
import { accessControlEnabledQueryKey } from './useAccessControlEnabledQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
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
  patchAccessControlEnabledSettings: UseMutateAsyncFunction<
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
  const queryClient = useQueryClient()
  const queryKey = accessControlEnabledQueryKey(host)
  // Fun case. When turning on CRS, no documentation is required, obviously.
  // If we ever add a way to turn off CRS, this will need documentation.
  // Until then, this is fine.
  // eslint-disable-next-line opentrons/no-direct-use-mutation -- directly calling useMutation is deprecated in the codebase. Update this to useDocumentedMutation before using this function.
  const mutation = useMutation(
    queryKey,
    async (body: PatchAccessControlEnabledSettingsRequest) => {
      const response = await patchAccessControlEnabled(host!, body)
      queryClient.setQueryData(queryKey, response.data)
      return response.data
    },
    options
  )

  return {
    ...mutation,
    patchAccessControlEnabledSettings: mutation.mutateAsync,
  }
}
