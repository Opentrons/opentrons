import { MemoryRouter } from 'react-router-dom'
import type * as ReactRouterDom from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { Login } from '..'

const mockNavigate = vi.fn()
const mockSubmitPassword = vi.fn()

vi.mock('/app/resources/auth', () => ({
  useOAuth2PasswordLogin: vi.fn(),
}))

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof ReactRouterDom>()
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
    <div data-testid="mock-full-keyboard">
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

const renderLogin = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )[0]
}

describe('Login', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockSubmitPassword.mockReset()
    vi.mocked(useOAuth2PasswordLogin).mockReturnValue({
      submitPassword: mockSubmitPassword,
      isAuthLoading: false,
    })
  })

  it('renders navigation, username field, and action buttons', () => {
    renderLogin()
    expect(screen.getAllByText('Login').length).toBeGreaterThanOrEqual(1)
    screen.getByText('Username')
    screen.getByText('next')
    screen.getByText('cancel')
    expect(screen.getByTestId('login-field')).toHaveAttribute('type', 'text')
  })

  it('navigates back when cancel is pressed', () => {
    renderLogin()
    fireEvent.click(screen.getByTestId('ChildNavigation_Secondary_Button'))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('disables next when username is empty', () => {
    renderLogin()
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeDisabled()
  })

  it('shows the software keyboard when the field is focused', () => {
    renderLogin()
    expect(screen.queryByTestId('mock-full-keyboard')).not.toBeInTheDocument()
    fireEvent.focus(screen.getByTestId('login-field'))
    expect(screen.getByTestId('mock-full-keyboard')).toBeInTheDocument()
  })

  it('updates the username when typing in the text field', () => {
    renderLogin()
    const input = screen.getByTestId('login-field')
    fireEvent.change(input, { target: { value: 'lab_user' } })
    expect(input).toHaveValue('lab_user')
  })

  it('updates the username when FullKeyboard reports a new value', () => {
    renderLogin()
    fireEvent.focus(screen.getByTestId('login-field'))
    fireEvent.click(
      screen.getByRole('button', { name: 'simulate keyboard input' })
    )
    expect(screen.getByTestId('login-field')).toHaveValue('from_keyboard')
  })

  it('switches label and input to password after next with a non-empty username', () => {
    renderLogin()
    fireEvent.change(screen.getByTestId('login-field'), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    screen.getByText('Password')
    const input = screen.getByTestId('login-field')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveValue('')
  })

  it('disables next on the password step when password is empty', () => {
    renderLogin()
    fireEvent.change(screen.getByTestId('login-field'), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeDisabled()
  })

  it('toggles password visibility when the eye control is pressed', () => {
    renderLogin()
    fireEvent.change(screen.getByTestId('login-field'), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    const input = screen.getByTestId('login-field')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByTestId('login-password-hide')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
    expect(screen.getByTestId('login-password-show')).toBeInTheDocument()
  })

  it('submits username and password when confirming a non-empty password', () => {
    renderLogin()
    fireEvent.change(screen.getByTestId('login-field'), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    fireEvent.change(screen.getByTestId('login-field'), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    expect(mockSubmitPassword).toHaveBeenCalledWith('user1', 'secret')
  })
})
