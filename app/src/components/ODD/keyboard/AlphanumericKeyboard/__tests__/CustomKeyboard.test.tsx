import { useRef } from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { AlphanumericKeyboard } from '..'

import type { ReactNode } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

function TestKeyboard(): ReactNode {
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputElementRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input data-testid="AlphanumericKeyboard_Input" ref={inputElementRef} />
      <AlphanumericKeyboard
        keyboardRef={keyboardRef}
        inputElementRef={inputElementRef}
      />
    </>
  )
}

const render = () => {
  return renderWithProviders(<TestKeyboard />)[0]
}

describe('AlphanumericKeyboard', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render alphanumeric keyboard - lower case', () => {
    render()
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
      '123',
      'a',
      's',
      'd',
      'f',
      'g',
      'h',
      'j',
      'k',
      'l',
      'ABC',
      'z',
      'x',
      'c',
      'v',
      'b',
      'n',
      'm',
      'del',
    ]
    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })
  it('should render alphanumeric keyboard - upper case, when clicking ABC key', async () => {
    const user = userEvent.setup()
    render()
    const shiftKey = screen.getByRole('button', { name: 'ABC' })
    await user.click(shiftKey)

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
      '123',
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
    ]
    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should render alphanumeric keyboard - numbers, when clicking number key', async () => {
    const user = userEvent.setup()
    render()
    const numberKey = screen.getByRole('button', { name: '123' })
    await user.click(numberKey)
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

  it('should render alphanumeric keyboard - lower case when layout is numbers and clicking abc ', async () => {
    const user = userEvent.setup()
    render()
    const numberKey = screen.getByRole('button', { name: '123' })
    await user.click(numberKey)
    const abcKey = screen.getByRole('button', { name: 'abc' })
    await user.click(abcKey)
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
      '123',
      'a',
      's',
      'd',
      'f',
      'g',
      'h',
      'j',
      'k',
      'l',
      'ABC',
      'z',
      'x',
      'c',
      'v',
      'b',
      'n',
      'm',
      'del',
    ]
    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should switch each alphanumeric keyboard properly', async () => {
    const user = userEvent.setup()
    render()
    // lower case keyboard -> upper case keyboard
    const ABCKey = screen.getByRole('button', { name: 'ABC' })
    await user.click(ABCKey)
    screen.getByRole('button', { name: 'A' })
    // upper case keyboard -> number keyboard
    const numberKey = screen.getByRole('button', { name: '123' })
    await user.click(numberKey)
    screen.getByRole('button', { name: '1' })
    // number keyboard -> lower case keyboard
    const abcKey = screen.getByRole('button', { name: 'abc' })
    await user.click(abcKey)
    screen.getByRole('button', { name: 'a' })
  })

  it('should update the input when clicking keys', async () => {
    const user = userEvent.setup()
    render()
    await user.click(screen.getByRole('button', { name: 'a' }))
    await user.click(screen.getByRole('button', { name: 'b' }))
    await user.click(screen.getByRole('button', { name: 'c' }))
    expect(screen.getByTestId('AlphanumericKeyboard_Input')).toHaveValue('abc')
  })
})
