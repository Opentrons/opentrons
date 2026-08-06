import { useMutation } from 'react-query'

import { createSession } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseMutateFunction, UseMutationResult } from 'react-query'
import type { CreateSessionData, Session } from '@opentrons/api-client'

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
  // Directly calling useMutation is deprecated in the codebase. Update this to useDocumentedMutation before using this hook.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation<Session, Error>(
    getQueryKey(host, 'session'),
    () =>
      createSession(host!, createSessionData)
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
