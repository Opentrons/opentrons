import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { RobotSettingsCameraUsage } from '../RobotSettingsCameraUsage'

import type { CameraUsageSettingsProps } from '../RobotSettingsCameraUsage'

const render = (props: CameraUsageSettingsProps) => {
  return renderWithProviders(<RobotSettingsCameraUsage {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RobotSettingsCameraUsage', () => {
  let mockProps: CameraUsageSettingsProps

  beforeEach(() => {
    mockProps = {
      toggleLiveVideoEnabled: vi.fn(),
      isLiveVideoEnabled: false,
      toggleRecoveryCaptureEnabled: vi.fn(),
      isRecoveryCaptureEnabled: false,
    }
  })

  it('renders usage settings header', () => {
    render(mockProps)

    screen.getByText('Usage Settings')
  })

  it('renders live video section with correct text', () => {
    render(mockProps)

    screen.getByText('Live Video')
    screen.getByText(
      'View real-time video of the deck while a running a protocol.'
    )
  })

  it('renders error recovery section with correct text', () => {
    render(mockProps)

    screen.getByText('Error Recovery')
    screen.getByText(
      'Automatically capture an image of the deck if an error occurs.'
    )
  })

  it('calls toggleLiveVideoEnabled when live video toggle is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const toggleButtons = screen.getAllByRole('switch')
    await user.click(toggleButtons[0])

    expect(mockProps.toggleLiveVideoEnabled).toHaveBeenCalledTimes(1)
  })

  it('calls toggleRecoveryCaptureEnabled when recovery capture toggle is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const toggleButtons = screen.getAllByRole('switch')
    await user.click(toggleButtons[1])

    expect(mockProps.toggleRecoveryCaptureEnabled).toHaveBeenCalledTimes(1)
  })
})
