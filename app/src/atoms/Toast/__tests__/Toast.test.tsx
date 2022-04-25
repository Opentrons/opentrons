import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { Toast } from '..'

const render = (props: React.ComponentProps<typeof Toast>) => {
  return renderWithProviders(<Toast {...props} />)[0]
}

describe('Toast', () => {
  let props: React.ComponentProps<typeof Toast>
  beforeEach(() => {
    props = {
      message: 'test message',
      type: 'success',
      closeButton: true,
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
  it('calls onClose when close button is pressed', () => {
    const { getByRole } = render(props)
    const closeButton = getByRole('button')
    fireEvent.click(closeButton)
    expect(props.onClose).toHaveBeenCalled()
  })
  it('does not render x button if prop is false', () => {
    props = {
      message: 'test message',
      type: 'success',
      closeButton: false,
      onClose: jest.fn(),
    }
    const { queryByRole } = render(props)
    expect(queryByRole('button')).toBeNull()
  })
  it('should render success toast when passing success as type', () => {
    props = {
      message: 'test message',
      type: 'success',
      closeButton: false,
      onClose: jest.fn(),
    }
    const { getByTestId } = render(props)
    const warningToast = getByTestId('Toast_success')
    expect(warningToast).toHaveStyle(`color: #04aa65
    background-color: #f3fffa`)
  })
  it('should render warning toast when passing warning as type', () => {
    props = {
      message: 'test message',
      type: 'warning',
      closeButton: false,
      onClose: jest.fn(),
    }
    const { getByTestId } = render(props)
    const warningToast = getByTestId('Toast_warning')
    expect(warningToast).toHaveStyle(`color: #f09d20
    background-color: #fffcf5`)
  })

  it('should render error toast when passing error as type', () => {
    props = {
      message: 'test message',
      type: 'error',
      closeButton: false,
      onClose: jest.fn(),
    }
    const { getByTestId } = render(props)
    const errorToast = getByTestId('Toast_error')
    expect(errorToast).toHaveStyle(`color: #bf0000
    background-color: #fff3f3`)
  })

  it('should render info toast when passing info as type', () => {
    props = {
      message: 'test message',
      type: 'info',
      closeButton: false,
      onClose: jest.fn(),
    }
    const { getByTestId } = render(props)
    const infoToast = getByTestId('Toast_info')
    expect(infoToast).toHaveStyle(`color: #16212D
    background-color: #eaeaeb`)
  })
})
