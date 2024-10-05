import type * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'
import { BackgroundOverlay } from '..'

const render = (props: React.ComponentProps<typeof BackgroundOverlay>) => {
  return renderWithProviders(<BackgroundOverlay {...props} />)[0]
}

describe('BackgroundOverlay', () => {
  let props: React.ComponentProps<typeof BackgroundOverlay>
  it('renders background overlay', () => {
    props = { onClick: vi.fn() }
    render(props)
    fireEvent.click(screen.getByLabelText('BackgroundOverlay'))
    expect(props.onClick).toHaveBeenCalled()
  })
})
