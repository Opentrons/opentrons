import { useMutation } from 'react-query'

import { createSession } from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type {
  CreateSessionData,
  HostConfig,
  Session,
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
