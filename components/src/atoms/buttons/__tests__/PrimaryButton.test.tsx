import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '../../../testing/utils'
import { PrimaryButton } from '../PrimaryButton'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof PrimaryButton>) => {
  return renderWithProviders(<PrimaryButton {...props} />)[0]
}

describe('PrimaryButton', () => {
  let props: ComponentProps<typeof PrimaryButton>

  beforeEach(() => {
    props = {
      children: 'primary button',
    }
  })

  it('renders primary button with text', () => {
    render(props)
    const button = screen.getByText('primary button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it('renders primary button with text and disabled', () => {
    props.disabled = true
    render(props)
    const button = screen.getByText('primary button')
    expect(button).toBeDisabled()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    props.onClick = handleClick
    render(props)
    const button = screen.getByText('primary button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
