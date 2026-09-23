import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRestartMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'

import {
  ProtocolSetupLoadingTimeoutModal,
  RUN_ERROR_TIMEOUT_DURATION_MS,
} from '../ProtocolSetupLoadingTimeoutModal'

import type { ComponentProps } from 'react'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const render = (
  props: ComponentProps<typeof ProtocolSetupLoadingTimeoutModal>
) => {
  return renderWithProviders(<ProtocolSetupLoadingTimeoutModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolSetupLoadingTimeoutModal', () => {
  const mockRestart = vi.fn()
  const mockOnReturnToDashboard = vi.fn()
  let props: ComponentProps<typeof ProtocolSetupLoadingTimeoutModal>

  beforeEach(() => {
    mockRestart.mockClear()
    mockOnReturnToDashboard.mockClear()
    vi.mocked(useRestartMutation).mockReturnValue({
      restart: mockRestart,
      isLoading: false,
    } as any)
    props = {
      onReturnToDashboard: mockOnReturnToDashboard,
    }
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('does not render until the loading timeout elapses', () => {
    render(props)
    expect(
      screen.queryByText('Run is taking longer than usual to load')
    ).not.toBeInTheDocument()
  })

  it('renders copy and calls onReturnToDashboard', () => {
    render(props)
    act(() => {
      vi.advanceTimersByTime(RUN_ERROR_TIMEOUT_DURATION_MS)
    })
    screen.getByText('Run is taking longer than usual to load')
    fireEvent.click(screen.getByText('Return to dashboard'))
    expect(mockOnReturnToDashboard).toHaveBeenCalled()
  })

  it('restarts the robot from the timeout modal', () => {
    render(props)
    act(() => {
      vi.advanceTimersByTime(RUN_ERROR_TIMEOUT_DURATION_MS)
    })
    fireEvent.click(screen.getByText('Restart robot'))
    expect(mockRestart).toHaveBeenCalled()
  })

  it('does not show the modal when disabled', () => {
    render({ ...props, enabled: false })
    act(() => {
      vi.advanceTimersByTime(RUN_ERROR_TIMEOUT_DURATION_MS)
    })
    expect(
      screen.queryByText('Run is taking longer than usual to load')
    ).not.toBeInTheDocument()
  })
})
