import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SetupRunCameraUsage } from '../SetupRunCameraSettings'

import type { SetupCameraProps } from '../SetupRunCameraSettings'

const render = (props: SetupCameraProps) => {
  return renderWithProviders(<SetupRunCameraUsage {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupRunCameraUsage', () => {
  let mockProps: SetupCameraProps

  beforeEach(() => {
    mockProps = {
      robotType: 'OT-3 Standard',
      runId: 'run123',
      liveStreamEnabled: true,
      recoveryEnabled: true,
      cameraConfirmed: false,
      toggleLiveStreamEnabled: vi.fn(),
      toggleRecoveryEnabled: vi.fn(),
    }
  })

  it('renders usage settings header', () => {
    render(mockProps)

    screen.getByText('Usage Settings')
  })

  it('renders live video setting card', () => {
    render(mockProps)

    screen.getByText('Live Video')
    screen.getByText(
      'View real-time video of the deck while a running a protocol.'
    )
  })

  it('renders error recovery setting card', () => {
    render(mockProps)

    screen.getByText('Error Recovery')
    screen.getByText(
      'Automatically capture an image of the deck if an error occurs.'
    )
  })

  it('renders both toggle buttons', () => {
    render(mockProps)

    const toggleButtons = screen.getAllByRole('switch')
    expect(toggleButtons).toHaveLength(2)
  })

  it('calls toggleLiveVideoEnabled when live video toggle is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const toggleButtons = screen.getAllByRole('switch')
    await user.click(toggleButtons[0])

    expect(mockProps.toggleLiveStreamEnabled).toHaveBeenCalledTimes(1)
  })

  it('calls toggleRecoveryCaptureEnabled when recovery capture toggle is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const toggleButtons = screen.getAllByRole('switch')
    await user.click(toggleButtons[1])

    expect(mockProps.toggleRecoveryEnabled).toHaveBeenCalledTimes(1)
  })
})
