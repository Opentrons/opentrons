import { useRef } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { AccordionKeyboard } from '..'
import styles from '../accordionkeyboard.module.css'

import type { ComponentProps } from 'react'

const mockToggle = vi.fn()

type AccordionKeyboardTestProps = Omit<
  ComponentProps<typeof AccordionKeyboard>,
  'inputRef'
>

function TestAccordionKeyboard(props: AccordionKeyboardTestProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input data-testid="AccordionKeyboard_Input" ref={inputRef} />
      <AccordionKeyboard {...props} inputRef={inputRef} />
    </>
  )
}

const render = (props: AccordionKeyboardTestProps) => {
  return renderWithProviders(<TestAccordionKeyboard {...props} />)
}

describe('AccordionKeyboard', () => {
  let props: AccordionKeyboardTestProps

  beforeEach(() => {
    mockToggle.mockClear()
    props = {
      children: <div>mock full softwarekeyboard</div>,
      isOpen: true,
      onToggle: mockToggle,
    }
  })

  it('shows children when isOpen is true', () => {
    render(props)
    expect(screen.getByText('mock full softwarekeyboard')).toBeVisible()
    expect(screen.getByTestId('AccordionKeyboard_body')).not.toHaveClass(
      styles.accordion_body_closed
    )
    expect(
      screen.getByRole('button', { name: 'Hide software keyboard' })
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('hides children when isOpen is false', () => {
    props = {
      ...props,
      isOpen: false,
    }
    render(props)
    expect(screen.getByTestId('AccordionKeyboard_body')).toHaveClass(
      styles.accordion_body_closed
    )
    expect(
      screen.getByRole('button', { name: 'Show software keyboard' })
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('calls onToggle when the chevron button is clicked', () => {
    render(props)
    fireEvent.click(
      screen.getByRole('button', { name: 'Hide software keyboard' })
    )
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onToggle on keydown when open and the input is focused', () => {
    render(props)
    fireEvent.keyDown(screen.getByTestId('AccordionKeyboard_Input'), {
      key: 'a',
    })
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onToggle on Escape when closed and the input is focused', () => {
    props = {
      ...props,
      isOpen: false,
    }
    render(props)
    fireEvent.keyDown(screen.getByTestId('AccordionKeyboard_Input'), {
      key: 'Escape',
    })
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it('does not call onToggle on non-Escape keydown when closed', () => {
    props = {
      ...props,
      isOpen: false,
    }
    render(props)
    fireEvent.keyDown(screen.getByTestId('AccordionKeyboard_Input'), {
      key: 'a',
    })
    expect(mockToggle).not.toHaveBeenCalled()
  })

  it('does not call onToggle when keydown target is not the input', () => {
    render(props)
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Hide software keyboard' }),
      { key: 'a' }
    )
    expect(mockToggle).not.toHaveBeenCalled()
  })

  it('does not call onToggle for WakeUp keydown', () => {
    render(props)
    fireEvent.keyDown(screen.getByTestId('AccordionKeyboard_Input'), {
      key: 'WakeUp',
    })
    expect(mockToggle).not.toHaveBeenCalled()
  })
})
