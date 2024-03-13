import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, renderHook, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { Numpad } from '..'

const render = (props: React.ComponentProps<typeof Numpad>) => {
  return renderWithProviders(<Numpad {...props} />)[0]
}

describe('Numpad', () => {
  it('should render the numpad keys', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const buttons = screen.getAllByRole('button')
    const expectedButtonNames = [
      '7',
      '8',
      '9',
      '4',
      '5',
      '6',
      '1',
      '2',
      '3',
      '0',
      '.',
      'del',
    ]

    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should call mock function when clicking num key', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const numKey = screen.getByRole('button', { name: '1' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })
})
