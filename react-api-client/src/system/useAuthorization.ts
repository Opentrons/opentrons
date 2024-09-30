import { useRef, useEffect } from 'react'
import { createAuthorization, createRegistration } from '@opentrons/api-client'
import { useHost } from '../api'

import type {
  HostConfig,
  AuthorizationToken,
  CreateRegistrationParams,
  RegistrationToken,
} from '@opentrons/api-client'

interface UseAuthorizationResult {
  authorizationToken: AuthorizationToken | null
  registrationToken: RegistrationToken | null
}

export function useAuthorization(
  createRegistrationParams: CreateRegistrationParams
): UseAuthorizationResult {
  const host = useHost()
  // TODO(bh, 2023-05-31): refactor individual calls to react-query and separate mutations, consider moving this hook to app
  const registrationToken = useRef<RegistrationToken | null>(null)
  const authorizationToken = useRef<AuthorizationToken | null>(null)

  useEffect(() => {
    createRegistration(host as HostConfig, createRegistrationParams)
      .then(response => {
        registrationToken.current = response.data
        return createAuthorization(host as HostConfig, response.data)
      })
      .then(response => {
        authorizationToken.current = response.data
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    authorizationToken: authorizationToken.current,
    registrationToken: registrationToken.current,
  }
}
