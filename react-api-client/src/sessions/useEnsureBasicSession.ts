import { useEffect } from 'react'
import { SessionData, SESSION_TYPE_BASIC } from '@opentrons/api-client'
import { useSessionsByTypeQuery, useCreateSessionMutation } from '.'

export function useEnsureBasicSession(): SessionData | null {
  const { data: existingBasicSessions } = useSessionsByTypeQuery({
    sessionType: SESSION_TYPE_BASIC,
  })
  const { createSession, isLoading, isError } = useCreateSessionMutation({
    sessionType: SESSION_TYPE_BASIC,
  })

  useEffect(() => {
    if (existingBasicSessions == null && !isLoading && !isError) {
      createSession()
    }
  }, [existingBasicSessions, isLoading, createSession, isError])

  return existingBasicSessions?.data[0] ?? null
}
