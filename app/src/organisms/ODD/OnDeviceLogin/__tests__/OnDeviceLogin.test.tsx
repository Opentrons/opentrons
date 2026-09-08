import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
        passwordComplexity={null}
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

    fillField('access_control:login_form_password_field', 'temp-pass')
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
      screen.getByLabelText('access_control:on_device_login_confirm_password')
    ).toBeInTheDocument()
  })

  it('types into the login field with the software keyboard', async () => {
    const user = userEvent.setup()
    renderLogin({ initialStep: 'username' })

    await user.click(screen.getByRole('button', { name: 'a' }))
    await user.click(screen.getByRole('button', { name: 'b' }))

    expect(screen.getByLabelText('access_control:username')).toHaveValue('ab')
  })

  it('shows the one-time password label when reset password is required', () => {
    renderLogin({
      initialStep: 'password',
      loginResetPassword: true,
      initialUsername: 'alice',
    })

    expect(
      screen.getByLabelText('access_control:on_device_login_one_time_password')
    ).toBeInTheDocument()
  })

  it('advances from username to password', () => {
    const { onStepChange } = renderLogin({ initialStep: 'username' })

    fillField('access_control:username', 'alice')
    clickPrimary('next')

    expect(onStepChange).toHaveBeenCalledWith('password')
    expect(
      screen.getByLabelText('access_control:login_form_password_field')
    ).toBeInTheDocument()
  })

  it('keeps next enabled and shows a required error when the username is empty', () => {
    const { onStepChange } = renderLogin({ initialStep: 'username' })

    const nextButton = screen.getByRole('button', { name: 'next' })
    expect(nextButton).toBeEnabled()
    fireEvent.click(nextButton)

    expect(
      screen.getByText('on_device_login_username_required')
    ).toBeInTheDocument()
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it('submits credentials from the password step during normal login', () => {
    const { submitPassword } = renderLogin({
      initialStep: 'password',
      initialUsername: 'alice',
    })

    fillField('access_control:login_form_password_field', 'secret123')
    clickPrimary('confirm')

    expect(submitPassword).toHaveBeenCalledWith('alice', 'secret123')
  })

  it('keeps confirm enabled and shows a required error when the password is empty', () => {
    const { submitPassword } = renderLogin({
      initialStep: 'password',
      initialUsername: 'alice',
    })

    const confirmButton = screen.getByRole('button', { name: 'confirm' })
    expect(confirmButton).toBeEnabled()
    fireEvent.click(confirmButton)

    expect(
      screen.getByText('on_device_login_password_required')
    ).toBeInTheDocument()
    expect(submitPassword).not.toHaveBeenCalled()
  })

  it('keeps next enabled and shows a required error when the new password is empty', () => {
    const { onStepChange } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
    })

    const nextButton = screen.getByRole('button', { name: 'next' })
    expect(nextButton).toBeEnabled()
    fireEvent.click(nextButton)

    expect(
      screen.getByText('on_device_login_password_required')
    ).toBeInTheDocument()
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it('shows a length error when the new password is too short', () => {
    const { onStepChange } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
      passwordComplexity: { minLength: 8, requireSpecialCharacters: true },
    })

    fillField('access_control:on_device_login_new_password', 'abc')
    clickPrimary('next')

    expect(screen.getByText('must_be_at_least_characters')).toBeInTheDocument()
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it('shows a special-character error when length is met but a special character is missing', () => {
    const { onStepChange } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
      passwordComplexity: { minLength: 8, requireSpecialCharacters: true },
    })

    fillField('access_control:on_device_login_new_password', 'password1')
    clickPrimary('next')

    expect(
      screen.getByText('must_include_at_least_one_special_character')
    ).toBeInTheDocument()
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it('shows the length error when both password policy rules fail', () => {
    const { onStepChange } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
      passwordComplexity: { minLength: 8, requireSpecialCharacters: true },
    })

    fillField('access_control:on_device_login_new_password', 'short')
    clickPrimary('next')

    expect(screen.getByText('must_be_at_least_characters')).toBeInTheDocument()
    expect(
      screen.queryByText('must_include_at_least_one_special_character')
    ).not.toBeInTheDocument()
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it('advances to confirm password when the new password meets complexity rules', () => {
    const { onStepChange, submitPassword } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
      passwordComplexity: { minLength: 8, requireSpecialCharacters: true },
    })

    fillField('access_control:on_device_login_new_password', 'password!')
    clickPrimary('next')

    expect(onStepChange).toHaveBeenCalledWith('confirmPassword')
    expect(submitPassword).not.toHaveBeenCalled()
    expect(
      screen.queryByText('must_be_at_least_characters')
    ).not.toBeInTheDocument()
  })

  it('advances to confirm password when reset is required', () => {
    const { onStepChange, submitPassword } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
    })

    fillField('access_control:on_device_login_new_password', 'newpass123')
    clickPrimary('next')

    expect(onStepChange).toHaveBeenCalledWith('confirmPassword')
    expect(submitPassword).not.toHaveBeenCalled()
    expect(
      screen.getByLabelText('access_control:on_device_login_confirm_password')
    ).toBeInTheDocument()
  })

  it('shows a mismatch error when confirm password does not match', () => {
    const { submitPassword } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
    })

    fillField('access_control:on_device_login_new_password', 'newpass123')
    clickPrimary('next')
    fillField('access_control:on_device_login_confirm_password', 'different')
    clickPrimary('confirm')

    expect(
      screen.getByText('on_device_login_password_mismatch')
    ).toBeInTheDocument()
    expect(submitPassword).not.toHaveBeenCalled()
  })

  it('keeps confirm enabled and shows a required error when confirm password is empty', () => {
    const { submitPassword } = renderLogin({
      initialStep: 'confirmPassword',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
    })

    const confirmButton = screen.getByRole('button', { name: 'confirm' })
    expect(confirmButton).toBeEnabled()
    fireEvent.click(confirmButton)

    expect(
      screen.getByText('on_device_login_password_required')
    ).toBeInTheDocument()
    expect(submitPassword).not.toHaveBeenCalled()
  })

  it('submits when confirm password matches', () => {
    const { submitPassword } = renderLogin({
      initialStep: 'password',
      isPasswordResetRequired: true,
      initialUsername: 'alice',
    })

    fillField('access_control:on_device_login_new_password', 'newpass123')
    clickPrimary('next')
    fillField('access_control:on_device_login_confirm_password', 'newpass123')
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
      screen.getByLabelText('access_control:on_device_login_new_password')
    ).toBeInTheDocument()
  })
})
