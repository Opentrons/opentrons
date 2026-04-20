import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import { OnDeviceLoginPage } from '..'

import type * as ReactRouterDom from 'react-router-dom'

const mockNavigate = vi.fn()
const mockSubmitPassword = vi.fn()

vi.mock('/app/resources/auth', () => ({
  useOAuth2PasswordLogin: vi.fn(),
}))

vi.mock('/app/organisms/ToasterOven', () => ({
  useToaster: () => ({
    makeSnackbar: vi.fn(),
    makeToast: vi.fn(),
    eatToast: vi.fn(),
  }),
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
      <OnDeviceLoginPage />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )[0]
}

function getLoginInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector(
    'input[name="username"], input[name="password"]'
  )
  expect(el).not.toBeNull()
  return el as HTMLInputElement
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
    const { container } = renderLogin()
    expect(screen.getAllByText('Login').length).toBeGreaterThanOrEqual(1)
    screen.getByText('Username')
    screen.getByText('next')
    screen.getByText('cancel')
    expect(getLoginInput(container)).toHaveAttribute('type', 'text')
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
    const { container } = renderLogin()
    expect(screen.queryByTestId('mock-full-keyboard')).not.toBeInTheDocument()
    fireEvent.focus(getLoginInput(container))
    expect(screen.getByTestId('mock-full-keyboard')).toBeInTheDocument()
  })

  it('updates the username when typing in the text field', () => {
    const { container } = renderLogin()
    const input = getLoginInput(container)
    fireEvent.change(input, { target: { value: 'lab_user' } })
    expect(input).toHaveValue('lab_user')
  })

  it('updates the username when FullKeyboard reports a new value', () => {
    const { container } = renderLogin()
    fireEvent.focus(getLoginInput(container))
    fireEvent.click(
      screen.getByRole('button', { name: 'simulate keyboard input' })
    )
    expect(getLoginInput(container)).toHaveValue('from_keyboard')
  })

  it('switches label and input to password after next with a non-empty username', () => {
    const { container } = renderLogin()
    fireEvent.change(getLoginInput(container), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    screen.getByText('Password')
    const input = getLoginInput(container)
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveValue('')
  })

  it('disables next on the password step when password is empty', () => {
    const { container } = renderLogin()
    fireEvent.change(getLoginInput(container), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeDisabled()
  })

  it('toggles password visibility when the eye control is pressed', () => {
    const { container } = renderLogin()
    fireEvent.change(getLoginInput(container), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    const input = getLoginInput(container)
    expect(input).toHaveAttribute('type', 'password')
    const toggleBtn = screen.getByTitle('Toggle password visibility')
    fireEvent.click(toggleBtn)
    expect(input).toHaveAttribute('type', 'text')
    fireEvent.click(toggleBtn)
    expect(input).toHaveAttribute('type', 'password')
  })

  it('submits username and password when confirming a non-empty password', () => {
    const { container } = renderLogin()
    fireEvent.change(getLoginInput(container), {
      target: { value: 'user1' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    fireEvent.change(getLoginInput(container), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Primary_Button'))
    expect(mockSubmitPassword).toHaveBeenCalledWith('user1', 'secret')
  })
})
