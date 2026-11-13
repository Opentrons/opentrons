import { useState } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SortButton } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'
import type { SortDirection } from '..'

vi.mock('../../../helix/icons', () => ({
  Icon: ({ name, ...props }: { name: string }) => (
    <span data-testid="sort-icon" data-icon-name={name} {...props} />
  ),
}))

const render = (props: ComponentProps<typeof SortButton>) => {
  return renderWithProviders(<SortButton {...props} />)
}

function SortButtonTestWrapper() {
  const [direction, setDirection] = useState<SortDirection>('asc')

  const handleToggle = () => {
    setDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
  }

  return (
    <SortButton
      label="text"
      active={true}
      direction={direction}
      onClick={handleToggle}
    />
  )
}

describe('SortButton', () => {
  const mockFn = vi.fn()
  let props: ComponentProps<typeof SortButton>

  beforeEach(() => {
    vi.clearAllMocks()
    props = {
      label: 'text',
      active: false,
      direction: 'asc',
      onClick: mockFn,
    }
  })

  it('should render button with text and icon', () => {
    render(props)

    expect(screen.getByRole('button', { name: 'text' })).toBeInTheDocument()
    expect(screen.getByTestId('sort-icon')).toHaveAttribute(
      'data-icon-name',
      'chevron-up'
    )
  })

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup()
    render(props)

    await user.click(screen.getByRole('button', { name: 'text' }))

    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('when clicking the button, the icon should be switched', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SortButtonTestWrapper />)

    const button = screen.getByRole('button', { name: 'text' })

    expect(screen.getByTestId('sort-icon')).toHaveAttribute(
      'data-icon-name',
      'chevron-up'
    )

    await user.click(button)
    expect(screen.getByTestId('sort-icon')).toHaveAttribute(
      'data-icon-name',
      'chevron-down'
    )

    await user.click(button)
    expect(screen.getByTestId('sort-icon')).toHaveAttribute(
      'data-icon-name',
      'chevron-up'
    )
  })
})
