import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { AccordionKeyboard } from '..'

import type { ComponentProps } from 'react'

const mockToggle = vi.fn()

const render = (props: ComponentProps<typeof AccordionKeyboard>) => {
  return renderWithProviders(<AccordionKeyboard {...props} />)
}

describe('AccordionKeyboard', () => {
  let props: ComponentProps<typeof AccordionKeyboard>

  beforeEach(() => {
    props = {
      children: <div>mock full softwarekeyboard</div>,
      isOpen: true,
      onToggle: mockToggle,
    }
  })

  it('shows children when isOpen is true', () => {
    render(props)
    screen.getByText('mock full softwarekeyboard')
  })

  it('hides children when isOpen is false', () => {
    props = {
      ...props,
      isOpen: false,
    }
    render(props)
    expect(screen.queryByText('mock full softwarekeyboard')).toBeNull()
  })
})
