import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { LoggedOutOverlay } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof LoggedOutOverlay>) => {
  return renderWithProviders(<LoggedOutOverlay {...props} />)[0]
}

describe('LoggedOutOverlay', () => {
  it('renders a dialog with the accessible name and ARIA role', () => {
    render({})
    const overlay = screen.getByRole('dialog', { name: 'Logged out' })
    expect(overlay).toHaveAttribute('aria-modal', 'true')
  })

  it('invokes onClick when the overlay is clicked', () => {
    const onClick = vi.fn()
    render({ onClick })
    fireEvent.click(screen.getByRole('dialog', { name: 'Logged out' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
