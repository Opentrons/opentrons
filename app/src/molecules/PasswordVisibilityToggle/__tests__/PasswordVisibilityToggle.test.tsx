import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { PasswordVisibilityToggle } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof PasswordVisibilityToggle>) => {
  return renderWithProviders(<PasswordVisibilityToggle {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PasswordVisibilityToggle', () => {
  let props: ComponentProps<typeof PasswordVisibilityToggle>

  beforeEach(() => {
    props = {
      isVisible: false,
      onToggle: vi.fn(),
    }
  })

  it('renders the "Show" label when the password is hidden', () => {
    render(props)
    screen.getByRole('button', { name: 'Show' })
  })

  it('renders the "Hide" label when the password is visible', () => {
    render({ ...props, isVisible: true })
    screen.getByRole('button', { name: 'Hide' })
  })

  it('calls onToggle when the button is pressed', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(props.onToggle).toHaveBeenCalledTimes(1)
  })

  it('does not steal focus from an adjacent password input when clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <input aria-label="password" defaultValue="secret" />
        <PasswordVisibilityToggle {...props} />
      </>,
      { i18nInstance: i18n }
    )
    const input = screen.getByLabelText('password')
    input.focus()
    expect(input).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Show' }))

    expect(input).toHaveFocus()
    expect(props.onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders as type="button" so it does not submit a surrounding form', () => {
    render(props)
    expect(screen.getByRole('button', { name: 'Show' })).toHaveAttribute(
      'type',
      'button'
    )
  })

  it('renders an icon-only button with a static accessible name', () => {
    render({ ...props, iconOnly: true })
    expect(
      screen.getByRole('button', { name: 'Toggle password visibility' })
    ).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText('Show')).toBeNull()
    expect(screen.queryByText('Hide')).toBeNull()
  })

  it('sets aria-pressed when the icon-only password is visible', () => {
    render({ ...props, isVisible: true, iconOnly: true })
    expect(
      screen.getByRole('button', { name: 'Toggle password visibility' })
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onToggle when the icon-only button is pressed', () => {
    render({ ...props, iconOnly: true })
    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle password visibility' })
    )
    expect(props.onToggle).toHaveBeenCalledTimes(1)
  })

  it('does not steal focus from an adjacent password input when the icon-only button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <>
        <input aria-label="password" defaultValue="secret" />
        <PasswordVisibilityToggle {...props} iconOnly />
      </>,
      { i18nInstance: i18n }
    )
    const input = screen.getByLabelText('password')
    input.focus()
    expect(input).toHaveFocus()

    await user.click(
      screen.getByRole('button', { name: 'Toggle password visibility' })
    )

    expect(input).toHaveFocus()
    expect(props.onToggle).toHaveBeenCalledTimes(1)
  })
})
