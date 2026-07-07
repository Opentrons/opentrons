import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PasswordInputField } from '../PasswordInputField'

import type { ComponentProps } from 'react'

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
      onChange: vi.fn(),
    }
  })

  it('renders a masked password input by default', () => {
    const { container } = render(props)
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('reveals the password when the visibility toggle is clicked', () => {
    const { container } = render({ ...props, value: 'secret' })
    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle password visibility' })
    )
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveValue('secret')
  })

  it('calls onChange when the value changes', () => {
    const { container } = render(props)
    const input = container.querySelector('input')
    expect(input).not.toBeNull()
    fireEvent.change(input!, { target: { value: 'new-password' } })
    expect(props.onChange).toHaveBeenCalled()
  })

  it('displays a validation error', () => {
    render({ ...props, error: 'Passwords do not match' })
    screen.getByText('Passwords do not match')
  })
})
