import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PersonalAccountSettingsEditForm } from '../PersonalAccountSettingsEditForm'

import type { ComponentProps } from 'react'

const render = (
  props: ComponentProps<typeof PersonalAccountSettingsEditForm>
) => {
  return renderWithProviders(<PersonalAccountSettingsEditForm {...props} />, {
    i18nInstance: i18n,
  })[0]
}

function getPasswordInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input')).filter(
    (input): input is HTMLInputElement => input.type === 'password'
  )
}

describe('PersonalAccountSettingsEditForm', () => {
  let props: ComponentProps<typeof PersonalAccountSettingsEditForm>

  beforeEach(() => {
    props = {
      username: 'alice',
      fullName: 'Alice Example',
      isSaving: false,
      onSave: vi.fn(),
      onCancel: vi.fn(),
    }
  })

  it('prefills username and legal name from props', () => {
    render(props)
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice Example')).toBeInTheDocument()
    const saveButton = screen.getByRole('button', { name: 'save' })
    expect(saveButton).toBeDisabled()
    fireEvent.click(saveButton)
    expect(props.onCancel).not.toHaveBeenCalled()
    expect(props.onSave).not.toHaveBeenCalled()
  })

  it('calls onSave with only changed profile fields', () => {
    render(props)
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: 'alice2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    expect(props.onSave).toHaveBeenCalledWith({ data: { username: 'alice2' } })
  })

  it('calls onSave with password when both password fields match', () => {
    const { container } = render(props)
    const [firstPasswordInput, secondPasswordInput] =
      getPasswordInputs(container)
    fireEvent.change(firstPasswordInput, { target: { value: 'new-password' } })
    fireEvent.change(secondPasswordInput, {
      target: { value: 'different-password' },
    })
    fireEvent.blur(secondPasswordInput)
    screen.getByText('Passwords do not match')
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    expect(props.onSave).not.toHaveBeenCalled()
    const [passwordInput, confirmPasswordInput] = getPasswordInputs(container)
    fireEvent.change(passwordInput, { target: { value: 'new-password' } })
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'new-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    expect(props.onSave).toHaveBeenCalledWith({
      data: { password: 'new-password' },
    })
  })

  it('calls onCancel when the cancel button is clicked', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onCancel).toHaveBeenCalled()
  })

  it('shows a server save error on the confirm password field', () => {
    render({
      ...props,
      saveError: 'Unable to save account settings. Try again.',
    })
    screen.getByText('Unable to save account settings. Try again.')
  })

  it('shows a username error on the username field', () => {
    render({
      ...props,
      usernameError:
        'This username is already taken. Choose a different username.',
    })
    screen.getByText(
      'This username is already taken. Choose a different username.'
    )
  })
})
