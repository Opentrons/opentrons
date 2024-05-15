import {
  HostConfig,
  IndividualPipetteSettings,
  updatePipetteSettings,
  UpdatePipetteSettingsData,
} from '@opentrons/api-client'
import {
  useMutation,
  useQueryClient,
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type { AxiosError } from 'axios'

export type UpdatePipetteSettingsType = UseMutateAsyncFunction<
  IndividualPipetteSettings,
  AxiosError,
  UpdatePipetteSettingsData
>

export type UseUpdatePipetteSettingsMutationResult = UseMutationResult<
  IndividualPipetteSettings,
  AxiosError,
  UpdatePipetteSettingsData
> & {
  updatePipetteSettings: UpdatePipetteSettingsType
}

export type UseUpdatePipetteSettingsOptions = UseMutationOptions<
  IndividualPipetteSettings,
  AxiosError,
  UpdatePipetteSettingsData
>

export function useUpdatePipetteSettingsMutation(
  pipetteId: string,
  options: UseUpdatePipetteSettingsOptions = {},
  hostOverride?: HostConfig | null
): UseUpdatePipetteSettingsMutationResult {
  const contextHost = useHost()
  const queryClient = useQueryClient()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const sanitizedHost = getSanitizedQueryKeyObject(host)
  const mutation = useMutation<
    IndividualPipetteSettings,
    AxiosError,
    UpdatePipetteSettingsData
  >(
    [sanitizedHost, 'pipettes', 'settings'],
    ({ fields }) =>
      updatePipetteSettings(host as HostConfig, pipetteId, { fields })
        .then(response => {
          queryClient
            .invalidateQueries([sanitizedHost, 'pipettes', 'settings'])
            .catch((e: Error) =>
              console.error(
                `error invalidating pipette settings query: ${e.message}`
              )
            )
          return response.data
        })
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    updatePipetteSettings: mutation.mutateAsync,
  }
}
