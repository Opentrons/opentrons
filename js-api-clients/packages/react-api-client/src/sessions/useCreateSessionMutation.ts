import {
  HostConfig,
  Session,
  createSession,
  CreateSessionData,
} from '@opentrons/api-client'
import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { useHost } from '../api'

export interface UseCreateSessionMutationResult
  extends UseMutationResult<Session, unknown, void> {
  createSession: UseMutateFunction<Session, unknown, void>
}

export function useCreateSessionMutation(
  createSessionData: CreateSessionData
): UseCreateSessionMutationResult {
  const host = useHost()
  const mutation = useMutation<Session, unknown>(['session', host], () =>
    createSession(host as HostConfig, createSessionData).then(
      response => response.data
    )
  )
  return {
    ...mutation,
    createSession: mutation.mutate,
  }
}
