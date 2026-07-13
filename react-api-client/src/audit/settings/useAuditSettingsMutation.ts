import { useMutation, useQueryClient } from 'react-query'

import { patchAuditSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AuditSettingsResponse,
  PatchAuditSettingsRequest,
} from '@opentrons/api-client'

export type UseAuditSettingsMutationResult = UseMutationResult<
  AuditSettingsResponse,
  AxiosError,
  PatchAuditSettingsRequest
> & {
  patchAuditSettings: UseMutateAsyncFunction<
    AuditSettingsResponse,
    AxiosError,
    PatchAuditSettingsRequest
  >
}

export function useAuditSettingsMutation(
  options: UseMutationOptions<
    AuditSettingsResponse,
    AxiosError,
    PatchAuditSettingsRequest
  > = {}
): UseAuditSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const mutation = useMutation(
    getQueryKey(host, 'audit', 'external', 'settings'),
    (body: PatchAuditSettingsRequest) =>
      patchAuditSettings(host!, body)
        .then(response => {
          queryClient
            .invalidateQueries(
              getQueryKey(host, 'audit', 'external', 'settings')
            )
            .catch((e: Error) => {
              console.error(
                `error invalidating audit settings query: ${e.message}`
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
    patchAuditSettings: mutation.mutateAsync,
  }
}
