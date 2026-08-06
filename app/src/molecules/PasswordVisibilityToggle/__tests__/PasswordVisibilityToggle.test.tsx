import '@testing-library/jest-dom/vitest'

import { fireEvent, screen } from '@testing-library/react'
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

  it('renders as type="button" so it does not submit a surrounding form', () => {
    render(props)
    expect(screen.getByRole('button', { name: 'Show' })).toHaveAttribute(
      'type',
      'button'
    )
  })
})
