import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getLocalRobot } from '/app/redux/discovery/selectors'
import {
  getIsLoggedInToLocalRobot,
  logInOrRefresh,
} from '/app/redux/robot-auth'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { OnDeviceLoginOverlayProvider, useOnDeviceLoginModal } from '..'

import type * as ReactApiClient from '@opentrons/react-api-client'

const mockSubmitPassword = vi.fn()

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useAccessControlEnabledQuery: vi.fn(),
  }
})

vi.mock('/app/redux/discovery/selectors', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    getLocalRobot: vi.fn(),
  }
})

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    getIsLoggedInToLocalRobot: vi.fn(),
  }
})

vi.mock('/app/resources/auth', () => ({
  useOAuth2PasswordLogin: vi.fn(),
}))

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
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: undefined,
      isSuccess: false,
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(getLocalRobot).mockReturnValue({
      name: 'local-robot',
    } as ReturnType<typeof getLocalRobot>)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)
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
    const toggleBtn = screen.getByTitle('Toggle password visibility')
    fireEvent.click(toggleBtn)
    expect(input).toHaveAttribute('type', 'text')
    fireEvent.click(toggleBtn)
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
    const now = 1234

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(now)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('after a successful login, it dispatches the correct action and closes the modal', () => {
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
      const [, reduxStore] = renderLoginModal()
      fireEvent.change(getLoginInput(), {
        target: { value: 'test-username' },
      })
      fireEvent.click(screen.getByText('Next'))
      fireEvent.change(getLoginInput(), {
        target: { value: 'secret' },
      })
      fireEvent.click(screen.getByText('Confirm'))
      expect(screen.queryByText('Password')).not.toBeInTheDocument()
      expect(reduxStore.dispatch).toHaveBeenCalledWith(
        logInOrRefresh({
          username: 'test-username',
          robotName: 'local-robot',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: now + 3600 * 1000,
        })
      )
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
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
      isSuccess: true,
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(getLocalRobot).mockReturnValue({
      name: 'local-robot',
    } as ReturnType<typeof getLocalRobot>)
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)
    vi.mocked(useOAuth2PasswordLogin).mockReturnValue({
      submitPassword: mockSubmitPassword,
      isAuthLoading: false,
    })
  })

  it('renders the logged-out overlay when access control is on and user is not logged in', () => {
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

  it('does not render the logged-out overlay when access control is off', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
      isSuccess: true,
    } as ReturnType<typeof useAccessControlEnabledQuery>)
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

  it('does not render the logged-out overlay when the user is logged in', () => {
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(true)
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
