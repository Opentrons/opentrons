import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, test, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { OnDeviceLoginOverlayProvider, useOnDeviceLoginModal } from '..'
import { useShouldShowLoggedOutOverlay, useStoreLoginState } from '../hooks'

const mockSubmitPassword = vi.fn()
const mockStoreLoginState = vi.fn()

vi.mock('/app/resources/auth', () => ({
  useOAuth2PasswordLogin: vi.fn(),
}))
vi.mock('../hooks')

vi.mock('/app/atoms/SoftwareKeyboard', () => ({
  FullKeyboard: ({
    onChange,
  }: {
    onChange: (input: string) => void
  }): JSX.Element => (
    <div>
      <button
        type="button"
        onClick={() => {
          onChange('from_keyboard')
        }}
      >
        simulate keyboard input
      </button>
    </div>
  ),
}))

function OpenOnMount(): JSX.Element {
  const { openLoginModal } = useOnDeviceLoginModal()
  return (
    <button
      type="button"
      onClick={() => {
        openLoginModal()
      }}
    >
      open
    </button>
  )
}

function renderLoginModal(): ReturnType<typeof renderWithProviders> {
  const [view, reduxStore] = renderWithProviders(
    <OnDeviceLoginOverlayProvider>
      <OpenOnMount />
    </OnDeviceLoginOverlayProvider>,
    { i18nInstance: i18n }
  )
  fireEvent.click(screen.getByRole('button', { name: 'open' }))
  return [view, reduxStore]
}

function getLoginInput(): HTMLInputElement {
  return screen.getByLabelText(/^(Username|Password)$/)
}

describe('Login', () => {
  beforeEach(() => {
    mockSubmitPassword.mockReset()
    mockStoreLoginState.mockReset()
    vi.mocked(useShouldShowLoggedOutOverlay).mockReturnValue(false)
    vi.mocked(useStoreLoginState).mockReturnValue(mockStoreLoginState)
    vi.mocked(useOAuth2PasswordLogin).mockReturnValue({
      submitPassword: mockSubmitPassword,
      isAuthLoading: false,
    })
  })

  it('renders navigation, username field, and action buttons', () => {
    renderLoginModal()
    expect(screen.getAllByText('Login').length).toBeGreaterThanOrEqual(1)
    screen.getByText('Username')
    screen.getByText('Next')
    screen.getByText('cancel')
    expect(getLoginInput()).toHaveAttribute('type', 'text')
    expect(
      screen.queryByRole('button', { name: 'Back to previous page' })
    ).not.toBeInTheDocument()
  })

  it('closes the overlay when cancel is pressed', () => {
    renderLoginModal()
    expect(screen.getByText('Username')).toBeInTheDocument()
    fireEvent.click(screen.getByText('cancel'))
    expect(screen.queryByText('Username')).not.toBeInTheDocument()
  })

  it('disables next when username is empty', () => {
    renderLoginModal()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('shows the software keyboard when the field is focused', () => {
    renderLoginModal()
    expect(
      screen.queryByText('simulate keyboard input')
    ).not.toBeInTheDocument()
    fireEvent.focus(getLoginInput())
    screen.getByText('simulate keyboard input')
  })

  it('updates the username when typing in the text field', () => {
    renderLoginModal()
    const input = getLoginInput()
    fireEvent.change(input, { target: { value: 'lab_user' } })
    expect(input).toHaveValue('lab_user')
  })

  it('updates the username when FullKeyboard reports a new value', () => {
    renderLoginModal()
    fireEvent.focus(getLoginInput())
    fireEvent.click(screen.getByText('simulate keyboard input'))
    expect(getLoginInput()).toHaveValue('from_keyboard')
  })

  it('switches label and input to password after next with a non-empty username', () => {
    renderLoginModal()
    fireEvent.change(getLoginInput(), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByText('Next'))
    screen.getByText('Password')
    screen.getByRole('button', { name: 'Back to previous page' })
    const input = getLoginInput()
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveValue('')
  })

  it('returns to the username step when the back control is pressed on password', () => {
    renderLoginModal()
    fireEvent.change(getLoginInput(), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByText('Next'))
    screen.getByText('Password')
    fireEvent.click(
      screen.getByRole('button', { name: 'Back to previous page' })
    )
    screen.getByText('Username')
    expect(getLoginInput()).toHaveValue('user1')
    expect(
      screen.queryByRole('button', { name: 'Back to previous page' })
    ).not.toBeInTheDocument()
  })

  it('disables next on the password step when password is empty', () => {
    renderLoginModal()
    fireEvent.change(getLoginInput(), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
  })

  it('toggles password visibility when the eye control is pressed', () => {
    renderLoginModal()
    fireEvent.change(getLoginInput(), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByText('Next'))
    const input = getLoginInput()
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(input).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('submits username and password when confirming a non-empty password', () => {
    renderLoginModal()
    fireEvent.change(getLoginInput(), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByText('Next'))
    fireEvent.change(getLoginInput(), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockSubmitPassword).toHaveBeenCalledWith('user1', 'secret')
  })

  describe('after successful password login', () => {
    test('after a successful login, it stores login state and closes the modal', () => {
      vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
        submitPassword: () => {
          onSuccess('test-username', {
            token_type: 'Bearer',
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
          })
        },
        isAuthLoading: false,
      }))
      renderLoginModal()
      fireEvent.change(getLoginInput(), {
        target: { value: 'test-username' },
      })
      fireEvent.click(screen.getByText('Next'))
      fireEvent.change(getLoginInput(), {
        target: { value: 'secret' },
      })
      fireEvent.click(screen.getByText('Confirm'))
      expect(screen.queryByText('Password')).not.toBeInTheDocument()
      expect(mockStoreLoginState).toHaveBeenCalledWith('test-username', {
        token_type: 'Bearer',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      })
    })
  })

  it('shows login failure under the password field instead of a snackbar', () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onError }) => ({
      submitPassword: () => {
        onError('ignored api message')
      },
      isAuthLoading: false,
    }))
    renderLoginModal()
    fireEvent.change(getLoginInput(), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByText('Next'))
    fireEvent.change(getLoginInput(), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByText('Confirm'))
    screen.getByText('Incorrect username or password.')
  })
})

describe('logged-out overlay', () => {
  beforeEach(() => {
    vi.mocked(useShouldShowLoggedOutOverlay).mockReturnValue(true)
    vi.mocked(useStoreLoginState).mockReturnValue(mockStoreLoginState)
    vi.mocked(useOAuth2PasswordLogin).mockReturnValue({
      submitPassword: mockSubmitPassword,
      isAuthLoading: false,
    })
  })

  it('renders the logged-out overlay when visibility hook returns true', () => {
    vi.mocked(useShouldShowLoggedOutOverlay).mockReturnValue(true)
    renderWithProviders(
      <OnDeviceLoginOverlayProvider>
        <span>child</span>
      </OnDeviceLoginOverlayProvider>,
      { i18nInstance: i18n }
    )
    expect(
      screen.getByRole('dialog', { name: 'Logged out' })
    ).toBeInTheDocument()
  })

  it('does not render the logged-out overlay when visibility hook returns false', () => {
    vi.mocked(useShouldShowLoggedOutOverlay).mockReturnValue(false)
    renderWithProviders(
      <OnDeviceLoginOverlayProvider>
        <span>child</span>
      </OnDeviceLoginOverlayProvider>,
      { i18nInstance: i18n }
    )
    expect(
      screen.queryByRole('dialog', { name: 'Logged out' })
    ).not.toBeInTheDocument()
  })

  it('opens the login modal when the logged-out overlay is clicked', () => {
    renderWithProviders(
      <OnDeviceLoginOverlayProvider>
        <span>child</span>
      </OnDeviceLoginOverlayProvider>,
      { i18nInstance: i18n }
    )
    expect(screen.queryByText('Username')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('dialog', { name: 'Logged out' }))
    expect(screen.getByText('Username')).toBeInTheDocument()
  })
})
