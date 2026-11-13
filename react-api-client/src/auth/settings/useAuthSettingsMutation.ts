import { useQueryClient } from 'react-query'

import { patchAuthSettings } from '@opentrons/api-client'

import { useDocumentedMutation } from '../../accessControl'
import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  PatchAuthSettingsRequest,
  PatchAuthSettingsResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../../accessControl'
import type { DocumentedMutationParameters } from '../../accessControl/types'

export type UseAuthSettingsMutationResult = UseMutationResult<
  PatchAuthSettingsResponse,
  AxiosError,
  PatchAuthSettingsRequest
> & {
  patchAuthSettings: UseMutateFunction<
    PatchAuthSettingsResponse,
    AxiosError,
    PatchAuthSettingsRequest
  >
}

export type UseAuthSettingsMutationOptions = UseMutationOptions<
  PatchAuthSettingsResponse,
  AxiosError,
  PatchAuthSettingsRequest
>

export function useAuthSettingsMutation(
  documentationState: DocumentationState,
  options: UseAuthSettingsMutationOptions = {}
): UseAuthSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const mutation = useDocumentedMutation<
    PatchAuthSettingsResponse,
    AxiosError,
    PatchAuthSettingsRequest
  >(
    documentationState,
    ['update_auth_settings'],
    getQueryKey(host, 'auth', 'settings'),
    ({
      variables: body,
      userNotes,
    }: DocumentedMutationParameters<PatchAuthSettingsRequest>) =>
      patchAuthSettings(host!, body, userNotes)
        .then(response => {
          queryClient.setQueryData(
            getQueryKey(host, 'auth', 'settings'),
            response.data
          )
          return response.data
        })
        .catch((e: AxiosError) => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    patchAuthSettings: mutation.mutate,
  }
}
