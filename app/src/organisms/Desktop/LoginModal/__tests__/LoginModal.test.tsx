import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { showLoginModal } from '..'

import type {
  AuthUser,
  HostConfig,
  OAuth2TokenResponse,
} from '@opentrons/api-client'

vi.mock('/app/resources/access-control/useStoreLoginState')
vi.mock('/app/resources/auth')

const MOCK_HOST: HostConfig = { hostname: 'otie.local' }

const TOKEN_RESPONSE: OAuth2TokenResponse = {
  access_token: 'new-access-token',
  token_type: 'Bearer',
  expires_in: 180,
  refresh_token: 'new-refresh-token',
}

const AUTH_USER: AuthUser = {
  username: 'alice',
  fullName: 'Alice',
  accountType: 'user',
  scopes: [],
  locked: false,
  resetPassword: false,
}

const renderAndOpenLoginModal = (): void => {
  renderWithProviders(
    <NiceModal.Provider>
      <button
        type="button"
        onClick={() => {
          showLoginModal({ host: MOCK_HOST })
        }}
      >
        Open login modal
      </button>
    </NiceModal.Provider>,
    { i18nInstance: i18n }
  )
  fireEvent.click(screen.getByRole('button', { name: 'Open login modal' }))
}

describe('LoginModal', () => {
  beforeEach(() => {
    vi.mocked(useStoreLoginState).mockReturnValue(vi.fn())
    vi.mocked(useOAuth2PasswordLogin).mockReturnValue({
      submitPassword: vi.fn(),
      isAuthLoading: false,
    })
    vi.mocked(useSetNewPasswordAndSignIn).mockReturnValue({
      submitNewPassword: vi.fn(),
      isLoading: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the login form when opened', () => {
    renderAndOpenLoginModal()

    screen.getByText('Compliance Ready Software Login')
    screen.getByLabelText('Username')
    screen.getByLabelText('Password')
    screen.getByRole('button', { name: 'Forgot password?' })
  })

  it('shows forgot password content and returns to login on back', () => {
    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }))

    screen.getByText(
      'Log in to an admin account to reset the password for your account.'
    )
    expect(screen.queryByLabelText('Username')).toBeNull()
    screen.getByRole('button', { name: 'Back' })

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByLabelText('Username')).toHaveValue('alice')
    screen.getByLabelText('Password')
  })

  it('submits credentials, stores login state, and closes on success', () => {
    const storeLoginState = vi.fn()
    const submitPassword = vi.fn()
    vi.mocked(useStoreLoginState).mockReturnValue(storeLoginState)
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(
      ({ onSuccess }) =>
        ({
          submitPassword: (username: string, password: string) => {
            submitPassword(username, password)
            onSuccess(username, AUTH_USER, TOKEN_RESPONSE)
          },
          isAuthLoading: false,
        }) as ReturnType<typeof useOAuth2PasswordLogin>
    )

    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(submitPassword).toHaveBeenCalledWith('alice', 'secret-password')
    expect(storeLoginState).toHaveBeenCalledWith('alice', TOKEN_RESPONSE)
    expect(screen.queryByText('Compliance Ready Software Login')).toBeNull()
  })

  it('shows an error when authentication fails', () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(
      ({ onError }) =>
        ({
          submitPassword: () => {
            onError('Test error message')
          },
          isAuthLoading: false,
        }) as ReturnType<typeof useOAuth2PasswordLogin>
    )

    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    screen.getByText('Test error message')
    screen.getByText('Compliance Ready Software Login')
  })

  it('shows password expired view when login requires a new password', () => {
    const storeLoginState = vi.fn()
    vi.mocked(useStoreLoginState).mockReturnValue(storeLoginState)
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(
      ({ onSuccess }) =>
        ({
          submitPassword: (username: string, password: string) => {
            onSuccess(
              username,
              { ...AUTH_USER, resetPassword: true },
              TOKEN_RESPONSE
            )
          },
          isAuthLoading: false,
        }) as ReturnType<typeof useOAuth2PasswordLogin>
    )

    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'temp-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(storeLoginState).toHaveBeenCalledWith('alice', TOKEN_RESPONSE)
    screen.getByText('Password expired')
    screen.getByText(
      'Your password has expired. Choose a new password to continue.'
    )
    screen.getByLabelText('New password')
    screen.getByLabelText('Confirm password')
    screen.getByRole('button', { name: 'Confirm' })
  })

  it('submits a new password and closes on success', () => {
    const storeLoginState = vi.fn()
    const submitNewPassword = vi.fn()
    vi.mocked(useStoreLoginState).mockReturnValue(storeLoginState)
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(
      ({ onSuccess }) =>
        ({
          submitPassword: (username: string) => {
            onSuccess(
              username,
              { ...AUTH_USER, resetPassword: true },
              TOKEN_RESPONSE
            )
          },
          isAuthLoading: false,
        }) as ReturnType<typeof useOAuth2PasswordLogin>
    )
    vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(
      ({ onSuccess }) =>
        ({
          submitNewPassword: (username: string, password: string) => {
            submitNewPassword(username, password)
            onSuccess(username, TOKEN_RESPONSE)
          },
          isLoading: false,
        }) as ReturnType<typeof useSetNewPasswordAndSignIn>
    )

    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'temp-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'new-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(submitNewPassword).toHaveBeenCalledWith('alice', 'new-password')
    expect(storeLoginState).toHaveBeenLastCalledWith('alice', TOKEN_RESPONSE)
    expect(screen.queryByText('Compliance Ready Software Login')).toBeNull()
  })

  it('shows a mismatch error when confirm password does not match', () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(
      ({ onSuccess }) =>
        ({
          submitPassword: (username: string) => {
            onSuccess(
              username,
              { ...AUTH_USER, resetPassword: true },
              TOKEN_RESPONSE
            )
          },
          isAuthLoading: false,
        }) as ReturnType<typeof useOAuth2PasswordLogin>
    )

    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'temp-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'different-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    screen.getByText('Passwords do not match.')
  })
})
