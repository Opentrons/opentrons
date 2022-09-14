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
    const { getByRole, getAllByRole } = render(props)
    // first row
    getByRole('button', { name: '`' })
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
    getByRole('button', { name: '-' })
    getByRole('button', { name: '=' })
    getByRole('button', { name: 'backspace' })

    // second row
    getByRole('button', { name: 'tab' })
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
    getByRole('button', { name: '[' })
    getByRole('button', { name: ']' })
    getByRole('button', { name: '\\' })

    // third row
    getByRole('button', { name: 'caps' })
    getByRole('button', { name: 'a' })
    getByRole('button', { name: 's' })
    getByRole('button', { name: 'd' })
    getByRole('button', { name: 'f' })
    getByRole('button', { name: 'g' })
    getByRole('button', { name: 'h' })
    getByRole('button', { name: 'j' })
    getByRole('button', { name: 'k' })
    getByRole('button', { name: 'l' })
    getByRole('button', { name: ';' })
    getByRole('button', { name: "'" })
    getByRole('button', { name: '< enter' })

    // fourth row
    getByRole('button', { name: 'z' })
    getByRole('button', { name: 'x' })
    getByRole('button', { name: 'c' })
    getByRole('button', { name: 'v' })
    getByRole('button', { name: 'b' })
    getByRole('button', { name: 'n' })
    getByRole('button', { name: 'm' })
    getByRole('button', { name: ',' })
    getByRole('button', { name: '.' })
    getByRole('button', { name: '/' })
    const shiftButtons = getAllByRole('button', { name: 'shift' })
    expect(shiftButtons.length).toBe(2)

    // fifth row
    getByRole('button', { name: '.com' })
    getByRole('button', { name: '@' })
    getByRole('button', { name: '' }) // space keyboard
  })

  it('should render the software keyboards when hitting shift key', () => {
    const { getByRole, getAllByRole } = render(props)
    const shiftKey = getAllByRole('button', { name: 'shift' })[0]
    fireEvent.click(shiftKey)
    getByRole('button', { name: 'A' })
  })

  it('should call mock function when clicking a key', () => {
    const { getByRole } = render(props)
    const numKey = getByRole('button', { name: 'a' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })
})
