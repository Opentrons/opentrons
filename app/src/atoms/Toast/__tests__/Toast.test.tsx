import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { Toast, TOAST_ANIMATION_DURATION } from '..'

const render = (props: React.ComponentProps<typeof Toast>) => {
  return renderWithProviders(<Toast {...props} displayType="desktop" />, {
    i18nInstance: i18n,
  })[0]
}

describe('Toast', () => {
  let props: React.ComponentProps<typeof Toast>
  beforeEach(() => {
    props = {
      id: '1',
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
    jest.useFakeTimers()
    const { getByRole } = render(props)
    const closeButton = getByRole('button')
    fireEvent.click(closeButton)
    act(() => {
      jest.advanceTimersByTime(TOAST_ANIMATION_DURATION)
    })
    expect(props.onClose).toHaveBeenCalled()
  })

  it('does not render x button if prop is false', () => {
    props = {
      ...props,
      closeButton: false,
    }
    const { queryByRole } = render(props)
    expect(queryByRole('button')).toBeNull()
  })

  it('should have success styling when passing success as type', () => {
    const { getByTestId, getByLabelText } = render(props)
    const successToast = getByTestId('Toast_success')
    expect(successToast).toHaveStyle(`color: #04aa65
    background-color: #f3fffa`)
    getByLabelText('icon_success')
  })

  it('should have warning styling when passing warning as type', () => {
    props = {
      ...props,
      type: 'warning',
    }
    const { getByTestId, getByLabelText } = render(props)
    const warningToast = getByTestId('Toast_warning')
    expect(warningToast).toHaveStyle(`color: #f09d20
    background-color: #fffcf5`)
    getByLabelText('icon_warning')
  })

  it('should have error styling when passing error as type', () => {
    props = {
      ...props,
      type: 'error',
    }
    const { getByTestId, getByLabelText } = render(props)
    const errorToast = getByTestId('Toast_error')
    expect(errorToast).toHaveStyle(`color: #bf0000
    background-color: #fff3f3`)
    getByLabelText('icon_error')
  })

  it('should have info styling when passing info as type', () => {
    props = {
      ...props,
      type: 'info',
    }
    const { getByTestId, getByLabelText } = render(props)
    const infoToast = getByTestId('Toast_info')
    expect(infoToast).toHaveStyle(`color: #16212D
    background-color: #eaeaeb`)
    getByLabelText('icon_info')
  })

  it('should stay more than 7 seconds when disableTimeout is true', async () => {
    jest.useFakeTimers()
    props = {
      ...props,
      disableTimeout: true,
    }
    const { getByText } = render(props)
    getByText('test message')
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(props.onClose).not.toHaveBeenCalled()
    act(() => {
      jest.advanceTimersByTime(7000)
    })
    expect(props.onClose).not.toHaveBeenCalled()
  })

  it('should not stay more than 7 seconds when disableTimeout is false', async () => {
    jest.useFakeTimers()
    props = {
      ...props,
      disableTimeout: false,
    }
    const { getByText } = render(props)
    getByText('test message')
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(props.onClose).not.toHaveBeenCalled()
    act(() => {
      jest.advanceTimersByTime(9000)
    })
    expect(props.onClose).toHaveBeenCalled()
  })

  it('should dismiss when a second toast appears', async () => {
    jest.useFakeTimers()
    props = {
      ...props,
      disableTimeout: true,
      exitNow: true,
    }
    const { getByText } = render(props)
    getByText('test message')
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(props.onClose).not.toHaveBeenCalled()
    act(() => {
      jest.advanceTimersByTime(TOAST_ANIMATION_DURATION)
    })
    expect(props.onClose).toHaveBeenCalled()
  })
  it('renders link text with an optional callback', async () => {
    jest.useFakeTimers()
    props = {
      ...props,
      linkText: 'test link',
      onLinkClick: jest.fn(),
    }
    const { getByText } = render(props)
    const clickableLink = getByText('test link')
    fireEvent.click(clickableLink)
    expect(props.onLinkClick).toHaveBeenCalled()
  })
  it('toast will not disappear on a general click if both close button and clickable link present', async () => {
    jest.useFakeTimers()
    props = {
      ...props,
      linkText: 'test link',
      closeButton: true,
    }
    const { getByText } = render(props)
    const clickableLink = getByText('test message')
    fireEvent.click(clickableLink)
    act(() => {
      jest.advanceTimersByTime(TOAST_ANIMATION_DURATION)
    })
    expect(props.onClose).not.toHaveBeenCalled()
  })
})
