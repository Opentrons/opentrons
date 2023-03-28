import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { Toast } from '../Toast'

const render = (props: React.ComponentProps<typeof Toast>) => {
  return renderWithProviders(<Toast {...props} />)[0]
}

describe('Toast', () => {
  let props: React.ComponentProps<typeof Toast>
  beforeEach(() => {
    props = {
      id: '1',
      message: 'test message',
      secondaryMessage: 'secondary message',
      type: 'success',
      closeButton: 'Close',
      onClose: jest.fn(),
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct message', () => {
    const { getByText } = render(props)
    getByText('test message')
    getByText('secondary message')
  })
  it('truncates secondary message whern too long', () => {
    props = {
      id: '1',
      message: 'test message',
      secondaryMessage: 'Super-long-protocol-file-name-that-the-user-made.py',
      type: 'success',
      closeButton: 'Close',
      onClose: jest.fn(),
    }
    const { getByText } = render(props)
    getByText('Super-long-protocol-file-name-that-the-u...py')
  })
  it('calls onClose when close button is pressed', () => {
    const { getByRole } = render(props)
    const closeButton = getByRole('button')
    fireEvent.click(closeButton)
    expect(props.onClose).toHaveBeenCalled()
  })
  it('does not render close button if prop is undefined', () => {
    props = {
      id: '1',
      message: 'test message',
      type: 'success',
      closeButton: undefined,
      onClose: jest.fn(),
    }
    const { queryByRole } = render(props)
    expect(queryByRole('button')).toBeNull()
  })
  it('should have success styling when passing success as type', () => {
    props = {
      id: '1',
      message: 'test message',
      type: 'success',
      closeButton: false,
      onClose: jest.fn(),
    }
    const { getByTestId, getByLabelText } = render(props)
    const successToast = getByTestId('Toast_success')
    expect(successToast).toHaveStyle(`color: #04aa65
    background-color: ##baffcd`)
    getByLabelText('icon_success')
  })
  it('should have alert styling when passing alert as type', () => {
    props = {
      id: '1',
      message: 'test message',
      type: 'alert',
      closeButton: false,
      onClose: jest.fn(),
    }
    const { getByTestId, getByLabelText } = render(props)
    const alertToast = getByTestId('Toast_alert')
    expect(alertToast).toHaveStyle(`color: #f09d20
    background-color: #ffe9be`)
    getByLabelText('icon_alert')
  })

  it('after 5 seconds the toast should be closed automatically', async () => {
    jest.useFakeTimers()
    props = {
      id: '1',
      message: 'test message',
      type: 'success',
      duration: 5000,
      closeButton: false,
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

  it('should stay more than 5 seconds when requiredTimeout is true', async () => {
    jest.useFakeTimers()
    props = {
      id: '1',
      message: 'test message',
      type: 'success',
      closeButton: false,
      onClose: jest.fn(),
      disableTimeout: true,
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
    expect(props.onClose).not.toHaveBeenCalled()
  })

  it('should not stay more than 5 seconds when requiredTimeout is false', async () => {
    jest.useFakeTimers()
    props = {
      id: '1',
      message: 'test message',
      type: 'success',
      closeButton: false,
      onClose: jest.fn(),
      disableTimeout: false,
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
})
