import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SetupRunCameraUsage } from '../SetupRunCameraSettings'

import type { UseCameraUsageSettingsResult } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'
import type { SetupCameraProps } from '../SetupRunCameraSettings'

const render = (props: SetupCameraProps) => {
  return renderWithProviders(<SetupRunCameraUsage {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupRunCameraUsage', () => {
  let mockSettings: UseCameraUsageSettingsResult
  let mockProps: SetupCameraProps

  beforeEach(() => {
    mockSettings = {
      toggleCameraEnabled: vi.fn(),
      isCameraEnabled: true,
      toggleLiveVideoEnabled: vi.fn(),
      isLiveVideoEnabled: true,
      toggleRecoveryCaptureEnabled: vi.fn(),
      isRecoveryCaptureEnabled: true,
    }
    mockProps = {
      settings: mockSettings,
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

    expect(mockSettings.toggleLiveVideoEnabled).toHaveBeenCalledTimes(1)
  })

  it('calls toggleRecoveryCaptureEnabled when recovery capture toggle is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const toggleButtons = screen.getAllByRole('switch')
    await user.click(toggleButtons[1])

    expect(mockSettings.toggleRecoveryCaptureEnabled).toHaveBeenCalledTimes(1)
  })
})
