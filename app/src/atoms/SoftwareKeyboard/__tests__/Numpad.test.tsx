import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { renderWithProviders } from '@opentrons/components'
import { Numpad } from '../'

const render = (props: React.ComponentProps<typeof Numpad>) => {
  return renderWithProviders(<Numpad {...props} />)[0]
}

describe('Numpad', () => {
  let props: React.ComponentProps<typeof Numpad>

  beforeEach(() => {
    const { result } = renderHook(() => React.useRef(null))
    props = {
      onChange: jest.fn(),
      keyboardRef: result.current,
    }
  })
  it('should render the numpad keys', () => {
    const { getAllByRole } = render(props)
    const buttons = getAllByRole('button')
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
    const { getByRole } = render(props)
    const numKey = getByRole('button', { name: '1' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })
})
