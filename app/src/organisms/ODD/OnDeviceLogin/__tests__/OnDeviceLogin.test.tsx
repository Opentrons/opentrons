import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { OnDeviceLogin } from '..'

import type { ComponentProps } from 'react'
import type * as ReactI18next from 'react-i18next'
import type { LoginStep } from '..'

vi.mock('react-i18next', async importOriginal => {
  const actual = await importOriginal<typeof ReactI18next>()
  return {
    ...actual,
    useTranslation: vi.fn(),
  }
})

function renderLogin(
  props: Partial<ComponentProps<typeof OnDeviceLogin>> & {
    initialStep?: LoginStep
  } = {}
): {
  submitPassword: ReturnType<typeof vi.fn>
  onStepChange: ReturnType<typeof vi.fn>
  onCancel: ReturnType<typeof vi.fn>
} {
  const submitPassword = vi.fn()
  const onCancel = vi.fn()
  const onClearLoginError = vi.fn()
  const { initialStep = 'username', ...rest } = props
  const onStepChange = vi.fn()

  function Wrapper(): JSX.Element {
    const [step, setStep] = useState<LoginStep>(initialStep)

    const handleStepChange = (next: LoginStep): void => {
      setStep(next)
      onStepChange(next)
    }

    return (
      <OnDeviceLogin
        step={step}
        onStepChange={handleStepChange}
        submitPassword={submitPassword}
        isAuthLoading={false}
        onCancel={onCancel}
        onClearLoginError={onClearLoginError}
        loginError={null}
        {...rest}
      />
    )
  }

  renderWithProviders(<Wrapper />)

  return { submitPassword, onStepChange, onCancel }
}

const clickPrimary = (name: 'next' | 'confirm'): void => {
  fireEvent.click(screen.getByRole('button', { name }))
}

const fillField = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('OnDeviceLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => key,
    } as ReturnType<typeof useTranslation>)
  })

  it('shows the login header on the username step', () => {
    renderLogin()
    expect(
      screen.getByRole('heading', { name: 'on_device_login' })
    ).toBeInTheDocument()
  })

  it('submits credentials from the password step when username is prefilled', () => {
    const { submitPassword } = renderLogin({
      initialStep: 'password',
      initialUsername: 'alice',
    })

    fillField('device_settings:password', 'temp-pass')
    clickPrimary('confirm')

    expect(submitPassword).toHaveBeenCalledWith('alice', 'temp-pass')
  })

  it('shows the back button on the password step when username is prefilled', () => {
    const { onStepChange } = renderLogin({
      initialStep: 'password',
      initialUsername: 'alice',
    })

    expect(
      screen.getByRole('button', { name: 'Back to previous page' })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(onStepChange).toHaveBeenCalledWith('username')
  })

  it('shows the back button on the password step during a normal login', () => {
    renderLogin({ initialStep: 'password' })

    expect(
      screen.getByRole('button', { name: 'Back to previous page' })
    ).toBeInTheDocument()
  })

  it('shows the new-password header when reset is required', () => {
    renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
    })
    expect(
      screen.getByRole('heading', { name: 'on_device_login_new_password' })
    ).toBeInTheDocument()
  })

  it('keeps the new-password header on the confirm-password step', () => {
    renderLogin({
      initialStep: 'confirmPassword',
      isPasswordResetRequired: true,
    })
    expect(
      screen.getByRole('heading', { name: 'on_device_login_new_password' })
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('device_settings:on_device_login_confirm_password')
    ).toBeInTheDocument()
  })

  it('advances from username to password', () => {
    const { onStepChange } = renderLogin({ initialStep: 'username' })

    fillField('device_settings:username', 'alice')
    clickPrimary('next')

    expect(onStepChange).toHaveBeenCalledWith('password')
    expect(
      screen.getByLabelText('device_settings:password')
    ).toBeInTheDocument()
  })

  it('submits credentials from the password step during normal login', () => {
    const { submitPassword } = renderLogin({
      initialStep: 'password',
      initialUsername: 'alice',
    })

    fillField('device_settings:password', 'secret123')
    clickPrimary('confirm')

    expect(submitPassword).toHaveBeenCalledWith('alice', 'secret123')
  })

  it('advances to confirm password when reset is required', () => {
    const { onStepChange, submitPassword } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
    })

    fillField('device_settings:on_device_login_new_password', 'newpass123')
    clickPrimary('next')

    expect(onStepChange).toHaveBeenCalledWith('confirmPassword')
    expect(submitPassword).not.toHaveBeenCalled()
    expect(
      screen.getByLabelText('device_settings:on_device_login_confirm_password')
    ).toBeInTheDocument()
  })

  it('shows a mismatch error when confirm password does not match', () => {
    const { submitPassword } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
    })

    fillField('device_settings:on_device_login_new_password', 'newpass123')
    clickPrimary('next')
    fillField('device_settings:on_device_login_confirm_password', 'different')
    clickPrimary('confirm')

    expect(
      screen.getByText('on_device_login_password_mismatch')
    ).toBeInTheDocument()
    expect(submitPassword).not.toHaveBeenCalled()
  })

  it('submits when confirm password matches', () => {
    const { submitPassword } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
    })

    fillField('device_settings:on_device_login_new_password', 'newpass123')
    clickPrimary('next')
    fillField('device_settings:on_device_login_confirm_password', 'newpass123')
    clickPrimary('confirm')

    expect(submitPassword).toHaveBeenCalledWith('alice', 'newpass123')
  })

  it('shows a login error on the password step', () => {
    renderLogin({
      initialStep: 'password',
      loginError: 'Incorrect username or password.',
    })

    expect(
      screen.getByText('Incorrect username or password.')
    ).toBeInTheDocument()
  })

  it('hides the back button on the password step when reset is required', () => {
    renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
    })

    expect(
      screen.queryByRole('button', { name: 'Back to previous page' })
    ).not.toBeInTheDocument()
  })

  it('hides cancel when a new password is required', () => {
    renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
    })

    expect(
      screen.queryByTestId('ChildNavigation_Secondary_Button')
    ).not.toBeInTheDocument()
  })

  it('shows the back button on the confirm-password step', () => {
    renderLogin({
      initialStep: 'confirmPassword',
      isPasswordResetRequired: true,
    })

    expect(
      screen.getByRole('button', { name: 'Back to previous page' })
    ).toBeInTheDocument()
  })

  it('returns to the password step when back is pressed on confirm', () => {
    const { onStepChange } = renderLogin({
      initialStep: 'confirmPassword',
      isPasswordResetRequired: true,
    })

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(onStepChange).toHaveBeenCalledWith('password')
    expect(
      screen.getByLabelText('device_settings:on_device_login_new_password')
    ).toBeInTheDocument()
  })
})
