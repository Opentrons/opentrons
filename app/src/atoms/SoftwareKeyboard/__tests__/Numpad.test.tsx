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
    const { getByRole } = render(props)
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
  })

  it('should call mock function when clicking num key', () => {
    const { getByRole } = render(props)
    const numKey = getByRole('button', { name: '1' })
    fireEvent.click(numKey)
    expect(props.onChange).toHaveBeenCalled()
  })
})
