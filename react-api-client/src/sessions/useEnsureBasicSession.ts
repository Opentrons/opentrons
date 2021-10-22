import { useEffect } from 'react'
import { SessionData, SESSION_TYPE_BASIC } from '@opentrons/api-client'
import { useSessionsByTypeQuery, useCreateSessionMutation } from '.'

export function useEnsureBasicSession(): {
  data: SessionData | null
  error: Error | null
} {
  const {
    data: existingBasicSessions,
    isLoading: isFetchingSession,
    isError: isGetSessionError,
    error: getSessionError,
  } = useSessionsByTypeQuery({
    sessionType: SESSION_TYPE_BASIC,
  })
  const {
    createSession,
    isLoading: isCreatingSession,
    isError: isCreateSessionError,
    error: createSessionError,
  } = useCreateSessionMutation({
    sessionType: SESSION_TYPE_BASIC,
  })

  useEffect(() => {
    if (
      existingBasicSessions == null &&
      !isFetchingSession &&
      !isCreatingSession &&
      !isCreateSessionError
    ) {
      createSession()
    }
  }, [
    existingBasicSessions,
    isFetchingSession,
    isCreatingSession,
    createSession,
    isCreateSessionError,
  ])

  if (isGetSessionError) {
    return { data: null, error: getSessionError }
  }
  if (isCreateSessionError) {
    return { data: null, error: createSessionError }
  }
  return { data: existingBasicSessions?.data[0] ?? null, error: null }
}
