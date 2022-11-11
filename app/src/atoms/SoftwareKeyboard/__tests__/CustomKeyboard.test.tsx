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
    const { getByRole } = render(props)
    // first row
    getByRole('button', { name: 'q' })
    getByRole('button', { name: 'w' })
    getByRole('button', { name: 'e' })
    getByRole('button', { name: 'r' })
    getByRole('button', { name: 't' })
    getByRole('button', { name: 'y' })
    getByRole('button', { name: 'u' })
    getByRole('button', { name: 'i' })
    getByRole('button', { name: 'o' })
    getByRole('button', { name: 'p' })

    // second row
    getByRole('button', { name: 'a' })
    getByRole('button', { name: 's' })
    getByRole('button', { name: 'd' })
    getByRole('button', { name: 'f' })
    getByRole('button', { name: 'g' })
    getByRole('button', { name: 'h' })
    getByRole('button', { name: 'j' })
    getByRole('button', { name: 'k' })
    getByRole('button', { name: 'l' })

    // third row
    getByRole('button', { name: '⇧' })
    getByRole('button', { name: 'z' })
    getByRole('button', { name: 'x' })
    getByRole('button', { name: 'c' })
    getByRole('button', { name: 'v' })
    getByRole('button', { name: 'b' })
    getByRole('button', { name: 'n' })
    getByRole('button', { name: 'm' })
    getByRole('button', { name: '⌫' })

    // fourth row
    getByRole('button', { name: '123' }) // numbers
    getByRole('button', { name: '' }) // space keyboard
    getByRole('button', { name: '< enter' })
  })
  it('should render the custom keyboards upper case, when clicking shift key', () => {
    const { getByRole } = render(props)
    const shiftKey = getByRole('button', { name: '⇧' })
    fireEvent.click(shiftKey)

    // first row
    getByRole('button', { name: 'Q' })
    getByRole('button', { name: 'W' })
    getByRole('button', { name: 'E' })
    getByRole('button', { name: 'R' })
    getByRole('button', { name: 'T' })
    getByRole('button', { name: 'Y' })
    getByRole('button', { name: 'U' })
    getByRole('button', { name: 'I' })
    getByRole('button', { name: 'O' })

    // second row
    getByRole('button', { name: 'A' })
    getByRole('button', { name: 'S' })
    getByRole('button', { name: 'D' })
    getByRole('button', { name: 'F' })
    getByRole('button', { name: 'G' })
    getByRole('button', { name: 'H' })
    getByRole('button', { name: 'J' })
    getByRole('button', { name: 'K' })
    getByRole('button', { name: 'L' })

    // third row
    getByRole('button', { name: '⇧' })
    getByRole('button', { name: 'Z' })
    getByRole('button', { name: 'X' })
    getByRole('button', { name: 'C' })
    getByRole('button', { name: 'V' })
    getByRole('button', { name: 'B' })
    getByRole('button', { name: 'N' })
    getByRole('button', { name: 'M' })
    // fourth row
    getByRole('button', { name: '123' }) // numbers
    getByRole('button', { name: '' }) // space keyboard
    getByRole('button', { name: '< enter' })
  })

  it('should render the custom keyboards numbers, when clicking number key', () => {
    const { getByRole } = render(props)
    const numberKey = getByRole('button', { name: '123' })
    fireEvent.click(numberKey)
    getByRole('button', { name: '1' })
    getByRole('button', { name: '2' })
    getByRole('button', { name: '3' })
    getByRole('button', { name: '4' })
    getByRole('button', { name: '5' })
    getByRole('button', { name: '6' })
    getByRole('button', { name: '7' })
    getByRole('button', { name: '8' })
    getByRole('button', { name: '9' })
    getByRole('button', { name: '0' })
    getByRole('button', { name: 'ABC' })
    getByRole('button', { name: '⌫' })
  })

  it('should render the custom keyboards lower case, when clicking number key then abc key', () => {
    const { getByRole } = render(props)
    const numberKey = getByRole('button', { name: '123' })
    getByRole('button', { name: 'a' })
    fireEvent.click(numberKey)
    getByRole('button', { name: '1' })
    const abcKey = getByRole('button', { name: 'ABC' })
    fireEvent.click(abcKey)
    getByRole('button', { name: 'a' })
  })
})
