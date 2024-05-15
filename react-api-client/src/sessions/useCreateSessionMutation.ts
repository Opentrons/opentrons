import { createSession } from '@opentrons/api-client'
import { useMutation } from 'react-query'
import { useHost } from '../api'

import type { UseMutationResult, UseMutateFunction } from 'react-query'
import type {
  HostConfig,
  Session,
  CreateSessionData,
} from '@opentrons/api-client'

export type UseCreateSessionMutationResult = UseMutationResult<
  Session,
  Error,
  void
> & {
  createSession: UseMutateFunction<Session, unknown, void>
}

export function useCreateSessionMutation(
  createSessionData: CreateSessionData
): UseCreateSessionMutationResult {
  const host = useHost()
  const mutation = useMutation<Session, Error>(['session', host], () =>
    createSession(host as HostConfig, createSessionData)
      .then(response => response.data)
      .catch((e: Error) => {
        throw e
      })
  )
  return {
    ...mutation,
    createSession: mutation.mutate,
  }
}
