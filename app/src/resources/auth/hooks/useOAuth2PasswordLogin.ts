import axios from 'axios'

import { OAUTH2_CLIENT_ID } from '@opentrons/api-client'
import { useGetOAuth2TokenMutation } from '@opentrons/react-api-client'

function getOAuth2PasswordLoginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { errors?: Array<{ detail?: string }> }
      | undefined
    const detail = data?.errors?.[0]?.detail
    if (detail != null && detail !== '') return detail
    if (error.response?.status != null) {
      return `${error.response.data.message}`
    }
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
