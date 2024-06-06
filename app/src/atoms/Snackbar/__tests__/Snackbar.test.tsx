import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen, act } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { Snackbar } from '..'

const render = (props: React.ComponentProps<typeof Snackbar>) => {
  return renderWithProviders(<Snackbar {...props} />)[0]
}

describe('Snackbar', () => {
  let props: React.ComponentProps<typeof Snackbar>
  beforeEach(() => {
    props = {
      message: 'test message',
      onClose: vi.fn(),
    }
  })

  it('renders correct message', () => {
    render(props)
    screen.getByText('test message')
  })

  it('should have proper styling', () => {
    props = {
      message: 'test message',
    }
    render(props)
    const testSnackbar = screen.getByTestId('Snackbar')
    expect(testSnackbar).toHaveStyle(`color: #16212D
    background-color: #eaeaeb`)
  })

  it('after 4 seconds the snackbar should be closed automatically', async () => {
    vi.useFakeTimers()
    props = {
      message: 'test message',
      duration: 4000,
      onClose: vi.fn(),
    }
    render(props)
    screen.getByText('test message')
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(props.onClose).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(props.onClose).toHaveBeenCalled()
  })

  it('should stay more than 4 seconds when given a longer duration', async () => {
    vi.useFakeTimers()
    props = {
      message: 'test message',
      duration: 8000,
      onClose: vi.fn(),
    }
    render(props)
    screen.getByText('test message')
    act(() => {
      vi.advanceTimersByTime(4100)
    })
    expect(props.onClose).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(props.onClose).toHaveBeenCalled()
  })
})
