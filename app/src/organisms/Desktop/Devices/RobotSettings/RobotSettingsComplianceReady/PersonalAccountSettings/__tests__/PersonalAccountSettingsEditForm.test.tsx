import '@testing-library/jest-dom/vitest'

import { fireEvent, screen, waitFor } from '@testing-library/react'
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
      onSave: vi.fn().mockResolvedValue(undefined),
      onCancel: vi.fn(),
    }
  })

  it('prefills username and legal name from props', () => {
    render(props)
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice Example')).toBeInTheDocument()
    screen.getByText('New password')
    screen.getByText('Confirm new password')
    expect(
      screen.getAllByRole('button', { name: 'Toggle password visibility' })
    ).toHaveLength(2)
    const saveButton = screen.getByRole('button', { name: 'Save' })
    expect(saveButton).toBeDisabled()
    fireEvent.click(saveButton)
    expect(props.onCancel).not.toHaveBeenCalled()
    expect(props.onSave).not.toHaveBeenCalled()
  })

  it('calls onSave with only changed profile fields', async () => {
    render(props)
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: 'alice2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith({
        data: { username: 'alice2' },
      })
    })
  })

  it('does not include username when it is unchanged', async () => {
    render(props)
    fireEvent.change(screen.getByDisplayValue('Alice Example'), {
      target: { value: 'Alice Updated' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith({
        data: { fullName: 'Alice Updated' },
      })
    })
  })

  it('does not save whitespace-only username changes', async () => {
    render(props)
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      expect(props.onSave).not.toHaveBeenCalled()
    })
  })

  it('shows a required username error when the username is cleared', async () => {
    render(props)
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument()
    })
    expect(props.onSave).not.toHaveBeenCalled()
  })

  it('calls onSave with password when both password fields match', async () => {
    const { container } = render(props)
    const [firstPasswordInput, secondPasswordInput] =
      getPasswordInputs(container)
    fireEvent.change(firstPasswordInput, { target: { value: 'new-password' } })
    fireEvent.change(secondPasswordInput, {
      target: { value: 'different-password' },
    })
    fireEvent.blur(secondPasswordInput)
    await waitFor(() => {
      screen.getByText('Passwords do not match')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(props.onSave).not.toHaveBeenCalled()
    const [passwordInput, confirmPasswordInput] = getPasswordInputs(container)
    fireEvent.change(passwordInput, { target: { value: 'new-password' } })
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'new-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith({
        data: { password: 'new-password' },
      })
    })
  })

  it('calls onCancel when the cancel button is clicked', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onCancel).toHaveBeenCalled()
  })

  it('shows a server save error on the confirm password field', async () => {
    render({
      ...props,
      onSave: vi.fn().mockRejectedValue(new Error('save failed')),
    })
    fireEvent.change(screen.getByDisplayValue('alice'), {
      target: { value: 'alice2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      screen.getByText('Unable to save account settings. Try again.')
    })
  })
})
