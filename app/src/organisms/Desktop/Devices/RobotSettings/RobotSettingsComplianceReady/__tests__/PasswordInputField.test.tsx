import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PasswordInputField } from '../PasswordInputField'

import type { ComponentProps } from 'react'

const PASSWORD_PLACEHOLDER = i18n.t('desktop_password_placeholder', {
  ns: 'device_settings',
})

const render = (props: ComponentProps<typeof PasswordInputField>) => {
  return renderWithProviders(<PasswordInputField {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PasswordInputField', () => {
  let props: ComponentProps<typeof PasswordInputField>

  beforeEach(() => {
    props = {
      value: '',
      placeholder: PASSWORD_PLACEHOLDER,
      onChange: vi.fn(),
    }
  })

  it('renders a masked password input by default', () => {
    render(props)
    expect(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER)).toHaveAttribute(
      'type',
      'password'
    )
  })

  it('renders a Show button by default', () => {
    render(props)
    screen.getByRole('button', { name: 'Show' })
  })

  it('reveals the password when the Show button is clicked', () => {
    render({ ...props, value: 'secret' })
    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    const input = screen.getByDisplayValue('secret')
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveValue('secret')
    screen.getByRole('button', { name: 'Hide' })
  })

  it('keeps focus on the password input when the Show button is clicked', async () => {
    const user = userEvent.setup()
    render({ ...props, value: 'secret' })
    const input = screen.getByDisplayValue('secret')
    input.focus()
    expect(input).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Show' }))

    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('type', 'text')
  })

  it('places caret at end when toggling password visibility', async () => {
    const user = userEvent.setup()
    render({ ...props, value: 'secret' })
    const input = screen.getByDisplayValue<HTMLInputElement>('secret')
    input.focus()
    input.setSelectionRange(3, 3)
    expect(input.selectionStart).toBe(3)
    expect(input.selectionEnd).toBe(3)

    await user.click(screen.getByRole('button', { name: 'Show' }))

    expect(input).toHaveFocus()
    expect(input.selectionStart).toBe(input.value.length)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('calls onChange when the value changes', () => {
    render(props)
    fireEvent.change(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER), {
      target: { value: 'new-password' },
    })
    expect(props.onChange).toHaveBeenCalled()
  })

  it('renders a placeholder when the field is empty', () => {
    render(props)
    const input = screen.getByPlaceholderText(PASSWORD_PLACEHOLDER)
    expect(input).toHaveAttribute('placeholder', PASSWORD_PLACEHOLDER)
    expect(input).toHaveValue('')
  })

  it('displays a validation error', () => {
    render({ ...props, error: 'Passwords do not match' })
    screen.getByText('Passwords do not match')
  })
})
