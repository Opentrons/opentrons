import axios from 'axios'

import { OAUTH2_CLIENT_ID } from '@opentrons/api-client'
import { useGetOAuth2TokenMutation } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'

function getOAuth2PasswordLoginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { errors?: Array<{ detail?: string }> }
      | undefined
    const detail = data?.errors?.[0]?.detail
    if (detail != null && detail !== '') return detail
    if (error.response?.status != null) {
      return `Login failed (${error.response.status})`
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
}

export interface UseOAuth2PasswordLoginResult {
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
  const { onSuccess } = options
  const { makeSnackbar } = useToaster()

  const { getOAuth2Token, isLoading } = useGetOAuth2TokenMutation({
    onSuccess: () => {
      onSuccess()
    },
    onError: (error: unknown) => {
      makeSnackbar(getOAuth2PasswordLoginErrorMessage(error))
    },
  })

  const submitPassword = (username: string, password: string): void => {
    getOAuth2Token({
      grant_type: 'password',
      username: username.trim(),
      password: password.trim(),
      client_id: OAUTH2_CLIENT_ID,
    })
  }

  return { submitPassword, isAuthLoading: isLoading }
}
