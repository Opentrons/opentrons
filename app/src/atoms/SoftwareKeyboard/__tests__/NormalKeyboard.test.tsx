import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { renderWithProviders } from '@opentrons/components'
import { NormalKeyboard } from '..'

const render = (props: React.ComponentProps<typeof NormalKeyboard>) => {
  return renderWithProviders(<NormalKeyboard {...props} />)[0]
}

describe('SoftwareKeyboard', () => {
  let props: React.ComponentProps<typeof NormalKeyboard>

  beforeEach(() => {
    const { result } = renderHook(() => React.useRef(null))
    props = {
      onChange: jest.fn(),
      keyboardRef: result.current,
    }
  })
  it('should render the software keyboards', () => {
    const { getAllByRole } = render(props)
    const buttons = getAllByRole('button')

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
      '⬆︎',
      'z',
      'x',
      'c',
      'v',
      'b',
      'n',
      'm',
      '⌫',
      '123',
      'space',
    ]

    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should render the software keyboards when hitting ⬆︎ shift key', () => {
    const { getAllByRole, getByRole } = render(props)
    const shiftKey = getByRole('button', { name: '⬆︎' })
    fireEvent.click(shiftKey)
    const buttons = getAllByRole('button')
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
      '⬆︎',
      'Z',
      'X',
      'C',
      'V',
      'B',
      'N',
      'M',
      '⌫',
      '123',
      'space',
    ]

    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should render the software keyboards when hitting 123 key', () => {
    const { getAllByRole, getByRole } = render(props)
    const numberKey = getByRole('button', { name: '123' })
    fireEvent.click(numberKey)
    const buttons = getAllByRole('button')
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
      '0',
      '-',
      '/',
      ':',
      ';',
      '(',
      ')',
      '$',
      '&',
      '@',
      '"',
      '#+=',
      '.',
      ',',
      '?',
      '!',
      "'",
      '⌫',
      'ABC',
      'space',
    ]

    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should render the software keyboards when hitting #+= key', () => {
    const { getAllByRole, getByRole } = render(props)
    const numberKey = getByRole('button', { name: '123' })
    fireEvent.click(numberKey)
    const symbolKey = getByRole('button', { name: '#+=' })
    fireEvent.click(symbolKey)
    const buttons = getAllByRole('button')
    const expectedButtonNames = [
      '[',
      ']',
      '{',
      '}',
      '#',
      '%',
      '^',
      '*',
      '+',
      '=',
      '_',
      '\\',
      '|',
      '~',
      '<',
      '>',
      '€',
      '£',
      '¥',
      '·',
      '123',
      '.',
      ',',
      '?',
      '!',
      "'",
      '⌫',
      'ABC',
      'space',
    ]

    buttons.forEach((button, index) => {
      const expectedName = expectedButtonNames[index]
      expect(button).toHaveTextContent(expectedName)
    })
  })

  it('should call mock function when clicking a key', () => {
    const { getByRole } = render(props)
    const aKey = getByRole('button', { name: 'a' })
    fireEvent.click(aKey)
    expect(props.onChange).toHaveBeenCalled()
  })
})
