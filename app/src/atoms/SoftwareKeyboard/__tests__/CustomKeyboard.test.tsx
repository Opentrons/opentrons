import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { renderWithProviders } from '@opentrons/components'
import { CustomKeyboard } from '..'

const render = (props: React.ComponentProps<typeof CustomKeyboard>) => {
  return renderWithProviders(<CustomKeyboard {...props} />)[0]
}

describe('CustomKeyboard', () => {
  let props: React.ComponentProps<typeof CustomKeyboard>

  beforeEach(() => {
    const { result } = renderHook(() => React.useRef(null))
    props = {
      onChange: jest.fn(),
      keyboardRef: result.current,
    }
  })

  it('should render the custom keyboards lower case', () => {
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
    const { getByRole, getAllByRole } = render(props)
    const shiftKey = getByRole('button', { name: 'SHIFT' })
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
      'SHIFT',
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
    const { getByRole, getAllByRole } = render(props)
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
    const { getByRole } = render(props)
    const numberKey = getByRole('button', { name: '123' })
    getByRole('button', { name: 'a' })
    fireEvent.click(numberKey)
    getByRole('button', { name: '1' })
    const abcKey = getByRole('button', { name: 'abc' })
    fireEvent.click(abcKey)
    getByRole('button', { name: 'a' })
  })
})
