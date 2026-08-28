import '@testing-library/jest-dom/vitest'

import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useRobot } from '/app/redux-resources/robots'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'
import { logOut } from '/app/redux/robot-auth'
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
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))
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
  logOut: vi.fn((payload: { robotName: string }) => ({
    type: 'robotAuth/logOut',
    payload,
  })),
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

function mockLoginAccountLocked(): void {
  mockLoginFailure(
    'Account locked. Please contact an administrator to unlock your account.'
  )
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
  vi.mocked(useSetNewPasswordAndSignIn).mockImplementation(
    (_documentationState, { onSuccess }) => ({
      submitNewPassword: (username: string, password: string) => {
        onSubmit?.(username, password)
        onSuccess(username, password)
      },
      isLoading: false,
    })
  )
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
    storeLoginState = vi.fn()
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

    screen.getByText('Compliance Ready Software login')
    expect(screen.getByLabelText('Username')).toHaveFocus()
    screen.getByLabelText('Password')
    screen.getByRole('button', { name: 'Toggle password visibility' })
    screen.getByRole('button', { name: 'Forgot password?' })
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
  })

  it('masks the password and reveals it when the visibility toggle is clicked', () => {
    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-password' },
    })
    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveValue('secret-password')

    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle password visibility' })
    )

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(passwordInput).toHaveValue('secret-password')

    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle password visibility' })
    )

    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('shows required field errors when log in is clicked with empty fields', () => {
    renderAndOpenLoginModal()

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    screen.getByText('Username required')
    screen.getByText('Password required')
    expect(submitPassword).not.toHaveBeenCalled()
  })

  it('shows a password required error when username is filled', () => {
    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    screen.getByText('Password required')
    expect(screen.queryByText('Username required')).toBeNull()
    expect(submitPassword).not.toHaveBeenCalled()
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
      AUTH_USER,
      TOKEN_RESPONSE
    )
    expect(screen.queryByText('Compliance Ready Software login')).toBeNull()
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
    screen.getByText('Compliance Ready Software login')
  })

  it('shows an account locked error when the account is locked', () => {
    mockLoginAccountLocked()

    renderAndOpenLoginModal()

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'alice' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    screen.getByText(
      'Account locked. Please contact an administrator to unlock your account.'
    )
  })

  it('shows password expired view when login requires a new password', () => {
    mockLoginRequiringPasswordReset()

    renderAndOpenLoginModal()
    logInWithTempPassword()

    expect(storeLoginState).toHaveBeenCalledWith(
      ROBOT_NAME,
      mockAuthUser({ resetPassword: true }),
      TOKEN_RESPONSE
    )
    screen.getByText('Your password has expired')
    screen.getByText('Create a new password to use')
    expect(screen.getByLabelText('New password')).toHaveFocus()
    screen.getByLabelText('Confirm password')
    screen.getByRole('button', { name: 'Confirm' })
  })

  it('logs out when closing the set new password view', () => {
    mockLoginRequiringPasswordReset()

    renderAndOpenLoginModal()
    logInWithTempPassword()

    fireEvent.click(
      screen.getByTestId(
        'ModalHeader_icon_close_Compliance Ready Software login'
      )
    )

    expect(vi.mocked(logOut)).toHaveBeenCalledWith({ robotName: ROBOT_NAME })
    expect(screen.queryByText('Your password has expired')).toBeNull()
  })

  it('returns to login after setting a new password', () => {
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
    expect(storeLoginState).toHaveBeenCalledTimes(1)
    screen.getByText('Password reset for alice')
    screen.getByTestId('Toast_success')
    screen.getByText('Compliance Ready Software login')
    expect(screen.getByLabelText('Username')).toHaveValue('alice')
    expect(screen.getByLabelText('Password')).toHaveValue('')
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

    expect(screen.getAllByText('Robot encryption key')).toHaveLength(2)
    screen.getByText('Verify robot encryption key')
    expect(screen.queryByText('Network Error')).toBeNull()
  })
})
