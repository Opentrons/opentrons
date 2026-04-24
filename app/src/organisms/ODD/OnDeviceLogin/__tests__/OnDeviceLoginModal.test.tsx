import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import NiceModal from '@ebay/nice-modal-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { handleOnDeviceLoginModal } from '../OnDeviceLoginModal'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()
const mockSubmitPassword = vi.fn()

vi.mock('/app/resources/auth', () => ({
  useOAuth2PasswordLogin: vi.fn(),
}))

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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

function renderLoginModal(options?: { returnToPath?: string }): void {
  renderWithProviders(
    <MemoryRouter>
      <NiceModal.Provider>
        <button
          type="button"
          onClick={() => {
            void handleOnDeviceLoginModal(
              options?.returnToPath != null
                ? { from: options.returnToPath }
                : undefined
            )
          }}
        >
          open
        </button>
      </NiceModal.Provider>
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
  fireEvent.click(screen.getByRole('button', { name: 'open' }))
}

function getLoginInput(): HTMLInputElement {
  return screen.getByLabelText(/^(Username|Password)$/) as HTMLInputElement
}

describe('OnDeviceLoginModal', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockSubmitPassword.mockReset()
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

  it('navigates to returnToPath and closes overlay after successful login when returnToPath is set', () => {
    vi.mocked(useOAuth2PasswordLogin).mockImplementation(({ onSuccess }) => ({
      submitPassword: () => {
        onSuccess()
      },
      isAuthLoading: false,
    }))
    renderLoginModal({ returnToPath: '/protocols' })
    fireEvent.change(getLoginInput(), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByText('Next'))
    fireEvent.change(getLoginInput(), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockNavigate).toHaveBeenCalledWith('/protocols', { replace: true })
    expect(screen.queryByText('Password')).not.toBeInTheDocument()
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
