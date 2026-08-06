import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import '@testing-library/jest-dom/vitest'

import { AccountIconButton } from '../AccountIconButton'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof AccountIconButton>) => {
  return renderWithProviders(<AccountIconButton {...props} />)[0]
}

describe('AccountIconButton', () => {
  it('renders the account initial', () => {
    render({ initial: 'T' })
    screen.getByText('T')
  })

  it('calls onClick when the button is clicked', () => {
    const onClick = vi.fn()
    render({ initial: 'T', onClick })
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
