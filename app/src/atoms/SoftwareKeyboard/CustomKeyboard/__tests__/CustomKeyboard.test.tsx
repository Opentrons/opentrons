import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, renderHook, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { CustomKeyboard } from '..'

const render = (props: React.ComponentProps<typeof CustomKeyboard>) => {
  return renderWithProviders(<CustomKeyboard {...props} />)[0]
}

describe('CustomKeyboard', () => {
  it('should render the custom keyboards lower case', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const buttons = screen.getAllByRole('button')
    const expectedButtonNames = [
      'q',
      'w',
      'e',
      'r',
      't',
      'y',
      'u',
      'i',
      'o',
      'p',
      'a',
      's',
      'd',
      'f',
      'g',
      'h',
      'j',
      'k',
      'l',
      'SHIFT',
      'z',
      'x',
      'c',
      'v',
      'b',
      'n',
      'm',
      'del',
      '123',
    ]
    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })
  it('should render the custom keyboards upper case, when clicking shift key', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const shiftKey = screen.getByRole('button', { name: 'SHIFT' })
    fireEvent.click(shiftKey)

    const buttons = screen.getAllByRole('button')
    const expectedButtonNames = [
      'Q',
      'W',
      'E',
      'R',
      'T',
      'Y',
      'U',
      'I',
      'O',
      'P',
      'A',
      'S',
      'D',
      'F',
      'G',
      'H',
      'J',
      'K',
      'L',
      'abc',
      'Z',
      'X',
      'C',
      'V',
      'B',
      'N',
      'M',
      'del',
      '123',
    ]
    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should render the custom keyboards numbers, when clicking number key', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const numberKey = screen.getByRole('button', { name: '123' })
    fireEvent.click(numberKey)
    const buttons = screen.getAllByRole('button')
    const expectedButtonNames = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'abc',
      '0',
      'del',
    ]
    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should render the custom keyboards lower case, when clicking number key then abc key', () => {
    const { result } = renderHook(() => React.useRef(null))
    const props = {
      onChange: vi.fn(),
      keyboardRef: result.current,
    }
    render(props)
    const numberKey = screen.getByRole('button', { name: '123' })
    screen.getByRole('button', { name: 'a' })
    fireEvent.click(numberKey)
    screen.getByRole('button', { name: '1' })
    const abcKey = screen.getByRole('button', { name: 'abc' })
    fireEvent.click(abcKey)
    screen.getByRole('button', { name: 'a' })
  })
})
