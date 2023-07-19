import * as React from 'react'
import { act } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { Snackbar } from '..'

const render = (props: React.ComponentProps<typeof Snackbar>) => {
  return renderWithProviders(<Snackbar {...props} />)[0]
}

describe('Snackbar', () => {
  let props: React.ComponentProps<typeof Snackbar>
  beforeEach(() => {
    props = {
      message: 'test message',
      onClose: jest.fn(),
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct message', () => {
    const { getByText } = render(props)
    getByText('test message')
  })

  it('should have proper styling', () => {
    props = {
      message: 'test message',
    }
    const { getByTestId } = render(props)
    const testSnackbar = getByTestId('Snackbar')
    expect(testSnackbar).toHaveStyle(`color: #16212D
    background-color: #eaeaeb`)
  })

  it('after 4 seconds the snackbar should be closed automatically', async () => {
    jest.useFakeTimers()
    props = {
      message: 'test message',
      duration: 4000,
      onClose: jest.fn(),
    }
    const { getByText } = render(props)
    getByText('test message')
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(props.onClose).not.toHaveBeenCalled()
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(props.onClose).toHaveBeenCalled()
  })

  it('should stay more than 4 seconds when given a longer duration', async () => {
    jest.useFakeTimers()
    props = {
      message: 'test message',
      duration: 8000,
      onClose: jest.fn(),
    }
    const { getByText } = render(props)
    getByText('test message')
    act(() => {
      jest.advanceTimersByTime(4100)
    })
    expect(props.onClose).not.toHaveBeenCalled()
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(props.onClose).toHaveBeenCalled()
  })
})
