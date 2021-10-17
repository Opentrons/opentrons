import { HostConfig, Protocol, createProtocol } from '@opentrons/api-client'
import type { JsonProtocolFile, ProtocolFileV3 } from '@opentrons/shared-data'
import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { useHost } from '../api'

export type UseCreateProtocolMutationResult = UseMutationResult<
  Protocol,
  unknown,
  void
> & {
  createProtocol: UseMutateFunction<Protocol, unknown, void>
}

export function useCreateProtocolMutation(
  protocolFile: JsonProtocolFile | ProtocolFileV3
): UseCreateProtocolMutationResult {
  const host = useHost()
  const mutation = useMutation<Protocol, unknown>(['protocols', host], () =>
    createProtocol(host as HostConfig, protocolFile).then(
      response => response.data
    )
  )
  return {
    ...mutation,
    createProtocol: mutation.mutate,
  }
}
