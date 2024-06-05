import { setLights } from '@opentrons/api-client'
import { useMutation } from 'react-query'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type {
  UseMutationResult,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'
import type { AxiosError } from 'axios'
import type { HostConfig, Lights, SetLightsData } from '@opentrons/api-client'

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
    [getSanitizedQueryKeyObject(host), 'robot', 'lights'],
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
