import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useRobot } from '/app/redux-resources/robots'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'
import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import { showLoginModal } from '..'

import type { AuthUser, OAuth2TokenResponse } from '@opentrons/api-client'

vi.mock('/app/resources/access-control/useStoreLoginState')
vi.mock('/app/resources/auth')
vi.mock('/app/resources/client_data/encryptionKeys')
vi.mock('/app/redux/shell/remote', () => ({
  appShellListener: vi.fn(),
  appShellUSBRequestor: {},
  tryInstallEncryptedRobotCertificate: vi.fn(),
  tryInstallPlaintextRobotCertificate: vi.fn(),
}))
vi.mock('/app/redux-resources/robots', () => ({
  useRobot: vi.fn(() => null),
}))
vi.mock('/app/redux/robot-auth', () => ({
  useAccessTokenForRobot: vi.fn(() => null),
}))

const ROBOT_NAME = 'otie'

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

function mockAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return { ...AUTH_USER, ...overrides }
}

function mockLoginSuccess(
  onSubmit?: (username: string, password: string) => void
): void {
  vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
    submitPassword: (username: string, password: string) => {
      onSubmit?.(username, password)
      onSuccess(username, mockAuthUser(), TOKEN_RESPONSE)
    },
    isAuthLoading: false,
  }))
}

function mockLoginRequiringPasswordReset(): void {
  vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
    submitPassword: (username: string, _password: string) => {
      onSuccess(username, mockAuthUser({ resetPassword: true }), TOKEN_RESPONSE)
    },
    isAuthLoading: false,
  }))
}

function mockLoginFailure(message: string): void {
  vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onError }) => ({
    submitPassword: () => {
      onError(message)
    },
    isAuthLoading: false,
  }))
}

function mockLoginSSLError(): void {
  const sslError = {
    isAxiosError: true,
    message: 'Network Error',
    code: 'ERR_NETWORK',
  }
  vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onError }) => ({
    submitPassword: () => {
      onError('Network Error', sslError)
    },
    isAuthLoading: false,
  }))
}

function mockSetNewPasswordSuccess(
  onSubmit?: (username: string, password: string) => void
): void {
  vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(({ onSuccess }) => ({
    submitNewPassword: (username: string, password: string) => {
      onSubmit?.(username, password)
      onSuccess(username, TOKEN_RESPONSE)
    },
    isLoading: false,
  }))
}

const renderAndOpenLoginModal = (): void => {
  renderWithProviders(
    <NiceModal.Provider>
      <button
        type="button"
        onClick={() => {
          showLoginModal({ robotName: ROBOT_NAME })
        }}
      >
        Open login modal
      </button>
    </NiceModal.Provider>,
    { i18nInstance: i18n }
  )
  fireEvent.click(screen.getByRole('button', { name: 'Open login modal' }))
}

function logInWithTempPassword(): void {
  fireEvent.change(screen.getByLabelText('Username'), {
    target: { value: 'alice' },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'temp-password' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
}

describe('LoginModal', () => {
  let storeLoginState: ReturnType<typeof useStoreLoginState>
  let submitPassword: ReturnType<
    typeof useOAuth2PasswordLogin
  >['submitPassword']
  let submitNewPassword: ReturnType<
    typeof useSetNewPasswordAndSignIn
  >['submitNewPassword']

  beforeEach(() => {
    storeLoginState =
      vi.fn<
        (
          robotName: string | null,
          username: string,
          successfulLoginResponse: OAuth2TokenResponse
        ) => void
      >()
    submitPassword = vi.fn<(username: string, password: string) => void>()
    submitNewPassword = vi.fn<(username: string, password: string) => void>()
    vi.mocked(useStoreLoginState).mockReturnValue(storeLoginState)
    vi.mocked(useOAuth2PasswordLogin).mockReturnValue({
      submitPassword,
      isAuthLoading: false,
    })
    vi.mocked(useSetNewPasswordAndSignIn).mockReturnValue({
      submitNewPassword,
      isLoading: false,
    })
    vi.mocked(useRobot).mockReturnValue(null)
    vi.mocked(useUpdateClientDataEncryptionKeys).mockReturnValue({
      requestKeyDisplay: vi.fn(() => 'request-key'),
      clearKeyDisplay: vi.fn(),
    } as any as ReturnType<typeof useUpdateClientDataEncryptionKeys>)
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
    mockLoginSuccess(submitPassword)

    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(submitPassword).toHaveBeenCalledWith('alice', 'secret-password')
    expect(storeLoginState).toHaveBeenCalledWith(
      ROBOT_NAME,
      'alice',
      TOKEN_RESPONSE
    )
    expect(screen.queryByText('Compliance Ready Software Login')).toBeNull()
  })

  it('shows an error when authentication fails', () => {
    mockLoginFailure('Test error message')

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
    mockLoginRequiringPasswordReset()

    renderAndOpenLoginModal()
    logInWithTempPassword()

    expect(storeLoginState).toHaveBeenCalledWith(
      ROBOT_NAME,
      'alice',
      TOKEN_RESPONSE
    )
    screen.getByText('Your password has expired')
    screen.getByText('Create a new password to use')
    screen.getByLabelText('New password')
    screen.getByLabelText('Confirm password')
    screen.getByRole('button', { name: 'Confirm' })
  })

  it('submits a new password and closes on success', () => {
    mockLoginRequiringPasswordReset()
    mockSetNewPasswordSuccess(submitNewPassword)

    renderAndOpenLoginModal()
    logInWithTempPassword()

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'new-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(submitNewPassword).toHaveBeenCalledWith('alice', 'new-password')
    expect(storeLoginState).toHaveBeenLastCalledWith(
      ROBOT_NAME,
      'alice',
      TOKEN_RESPONSE
    )
    expect(screen.queryByText('Compliance Ready Software Login')).toBeNull()
  })

  it('shows a mismatch error when confirm password does not match', () => {
    mockLoginRequiringPasswordReset()

    renderAndOpenLoginModal()
    logInWithTempPassword()

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'different-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    screen.getByText('Passwords do not match.')
  })

  it('shows a mismatch error when confirm password loses focus', () => {
    mockLoginRequiringPasswordReset()

    renderAndOpenLoginModal()
    logInWithTempPassword()

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'different-password' },
    })
    fireEvent.blur(screen.getByLabelText('Confirm password'))

    screen.getByText('Passwords do not match.')
  })

  it('shows a mismatch error on blur when confirm password is whitespace-only', () => {
    mockLoginRequiringPasswordReset()

    renderAndOpenLoginModal()
    logInWithTempPassword()

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: '   ' },
    })
    fireEvent.blur(screen.getByLabelText('Confirm password'))

    screen.getByText('Passwords do not match.')
  })

  it('shows a robot cert import modal when the login fails due to an SSL error', () => {
    vi.mocked(useRobot).mockReturnValue({
      ...mockConnectableRobot,
      ip: '1.2.3.4',
    })
    mockLoginSSLError()

    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    screen.getByText('Robot encryption key verification')
    screen.getByText('Verify robot encryption key')
    screen.getByLabelText('Robot encryption key')
    expect(screen.queryByText('Network Error')).toBeNull()
  })
})
