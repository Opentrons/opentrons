import {
  HostConfig,
  Lights,
  setLights,
  SetLightsData,
} from '@opentrons/api-client'
import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'
import { useHost } from '../api'
import type { AxiosError } from 'axios'

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
  options: UseSetLightsMutationOptions = {},
  hostOverride?: HostConfig | null
): UseSetLightsMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const mutation = useMutation<Lights, AxiosError, SetLightsData>(
    [host, 'robot', 'lights'],
    setLightsData =>
      setLights(host as HostConfig, setLightsData)
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
