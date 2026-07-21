import { setLights } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { HostConfig, Lights, SetLightsData } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export type UseSetLightsMutationResult = UseMutationResult<
  Lights,
  AxiosError,
  SetLightsData
> & {
  setLights: UseMutateFunction<Lights, AxiosError, SetLightsData>
}

export type UseSetLightsMutationOptions = UseMutationOptions<
  Lights,
  AxiosError,
  SetLightsData
>

export function useSetLightsMutation(
  documentationState: DocumentationState,
  options: UseSetLightsMutationOptions = {},
  hostOverride?: HostConfig | null
): UseSetLightsMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const mutation = useDocumentedMutation<Lights, AxiosError, SetLightsData>(
    documentationState,
    ['set_lights'],
    getQueryKey(host, 'robot', 'lights'),
    ({ variables: setLightsData, userNotes }) =>
      setLights(host!, setLightsData, userNotes)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )
  return {
    ...mutation,
    setLights: mutation.mutate,
  }
}
