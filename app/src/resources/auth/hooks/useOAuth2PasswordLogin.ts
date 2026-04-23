import axios from 'axios'

import { OAUTH2_CLIENT_ID } from '@opentrons/api-client'
import { useGetOAuth2TokenMutation } from '@opentrons/react-api-client'

/**
 * Shape of an error response from `POST /auth/oauth2/token`: the standard
 * RFC 6749 § 5.2 fields plus the opentrons-specific
 * `opentrons_login_attempts_remaining` field returned when the lockout limit
 * is configured.
 */
interface OAuth2TokenErrorResponse {
  error?: string
  error_description?: string
  opentrons_login_attempts_remaining?: number
}

function getOAuth2PasswordLoginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as OAuth2TokenErrorResponse | undefined
    const description = data?.error_description
    if (description != null && description !== '') return description
    const code = data?.error
    if (code != null && code !== '') return code
  }
  return error instanceof Error ? error.message : 'Login failed'
}

export interface UseOAuth2PasswordLoginOptions {
  /**
   * Called when the token endpoint succeeds (e.g. navigate away).
   * Use `useNavigate` from the caller for desktop vs ODD routing.
   */
  onSuccess: () => void
  /**
   * Called with a user-facing message when the token request fails.
   * Wire to `makeSnackbar` / toast in the page or organism, not in this hook.
   */
  onError: (message: string) => void
}

interface UseOAuth2PasswordLoginResult {
  submitPassword: (username: string, password: string) => void
  isAuthLoading: boolean
}

/**
 * Resource-owner password OAuth2 flow against `POST /auth/oauth2/token`
 * on the same base URL as the robot API (`ApiHostProvider` hostname/port).
 * Must run under `ApiHostProvider` so `useGetOAuth2TokenMutation` resolves the host.
 */
export function useOAuth2PasswordLogin(
  options: UseOAuth2PasswordLoginOptions
): UseOAuth2PasswordLoginResult {
  const { onSuccess, onError } = options

  const { getOAuth2Token, isLoading } = useGetOAuth2TokenMutation({
    onSuccess: () => {
      onSuccess()
    },
    onError: (error: unknown) => {
      onError(getOAuth2PasswordLoginErrorMessage(error))
    },
  })

  const submitPassword = (username: string, password: string): void => {
    getOAuth2Token({
      grant_type: 'password',
      username: username,
      password: password,
      client_id: OAUTH2_CLIENT_ID,
    })
  }

  return { submitPassword, isAuthLoading: isLoading }
}
