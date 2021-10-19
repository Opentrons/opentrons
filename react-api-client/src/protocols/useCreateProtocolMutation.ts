import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { createProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import type { HostConfig, Protocol } from '@opentrons/api-client'

export type UseCreateProtocolMutationResult = UseMutationResult<
  Protocol,
  unknown,
  void
> & {
  createProtocol: UseMutateFunction<Protocol, unknown, void>
}

export function useCreateProtocolMutation(
  protocolFiles: File[]
): UseCreateProtocolMutationResult {
  const host = useHost()
  const mutation = useMutation<Protocol, unknown>(['protocols', host], () =>
    createProtocol(host as HostConfig, protocolFiles).then(
      response => response.data
    )
  )
  return {
    ...mutation,
    createProtocol: mutation.mutate,
  }
}
