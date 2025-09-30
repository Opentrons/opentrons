import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { SetupRunCameraControls } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraControls'
import { SetupRunCameraUsage } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraSettings'

import { SetupCamera } from '..'

import type { UseStubCameraUsageSettingsResult } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useStubCameraUsageSettings'
import type { SetupCameraProps } from '..'

vi.mock(
  '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraControls'
)
vi.mock(
  '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraSettings'
)

const render = (props: SetupCameraProps) => {
  return renderWithProviders(<SetupCamera {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupCamera', () => {
  let mockSettings: UseStubCameraUsageSettingsResult
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
      cameraConfirmed: false,
      confirmCameraSettings: vi.fn(),
    }
    vi.mocked(SetupRunCameraControls).mockReturnValue(
      <div>MOCK_SETUP_RUN_CAMERA_CONTROLS</div>
    )
    vi.mocked(SetupRunCameraUsage).mockReturnValue(
      <div>MOCK_SETUP_RUN_CAMERA_USAGE</div>
    )
  })

  it('renders camera status section', () => {
    render(mockProps)

    screen.getByText('Camera Status')
    screen.getByText(
      'The deck camera provides live video during protocol runs, allows manual or automated image capture of the deck, and records images automatically when errors occur for easier troubleshooting.'
    )
  })

  it('renders enabled status when camera is enabled', () => {
    render(mockProps)

    screen.getByText('Enabled')
  })

  it('renders disabled status when camera is disabled', () => {
    const propsWithCameraDisabled = {
      ...mockProps,
      settings: { ...mockSettings, isCameraEnabled: false },
    }
    render(propsWithCameraDisabled)

    screen.getByText('Disabled')
  })

  it('calls toggleCameraEnabled when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const toggleButton = screen.getByRole('switch')
    await user.click(toggleButton)

    expect(mockSettings.toggleCameraEnabled).toHaveBeenCalledTimes(1)
  })

  it('does not render camera required notification when camera is enabled', () => {
    render(mockProps)

    expect(screen.queryByText('Camera is required.')).not.toBeInTheDocument()
  })

  it('renders camera required notification when camera is disabled', () => {
    const propsWithCameraDisabled = {
      ...mockProps,
      settings: { ...mockSettings, isCameraEnabled: false },
    }
    render(propsWithCameraDisabled)

    screen.getByText('Camera is required.')
    screen.getByText('Enable the camera to run this protocol.')
  })

  it('renders SetupRunCameraUsage when camera is enabled', () => {
    render(mockProps)

    screen.getByText('MOCK_SETUP_RUN_CAMERA_USAGE')
    expect(vi.mocked(SetupRunCameraUsage)).toHaveBeenCalledWith(
      { settings: mockSettings },
      {}
    )
  })

  it('does not render SetupRunCameraUsage when camera is disabled', () => {
    const propsWithCameraDisabled = {
      ...mockProps,
      settings: { ...mockSettings, isCameraEnabled: false },
    }
    render(propsWithCameraDisabled)

    expect(
      screen.queryByText('MOCK_SETUP_RUN_CAMERA_USAGE')
    ).not.toBeInTheDocument()
  })

  it('renders SetupRunCameraControls when camera is enabled', () => {
    render(mockProps)

    screen.getByText('MOCK_SETUP_RUN_CAMERA_CONTROLS')
  })

  it('does not render SetupRunCameraControls when camera is disabled', () => {
    const propsWithCameraDisabled = {
      ...mockProps,
      settings: { ...mockSettings, isCameraEnabled: false },
    }
    render(propsWithCameraDisabled)

    expect(
      screen.queryByText('MOCK_SETUP_RUN_CAMERA_CONTROLS')
    ).not.toBeInTheDocument()
  })

  it('renders confirm preferences button', () => {
    render(mockProps)

    screen.getByText('Confirm preferences')
  })

  it('confirm preferences button is enabled when camera is enabled and not confirmed', () => {
    render(mockProps)

    const confirmButton = screen.getByText('Confirm preferences')
    expect(confirmButton).not.toBeDisabled()
  })

  it('confirm preferences button is disabled when camera is confirmed', () => {
    const propsWithConfirmed = {
      ...mockProps,
      cameraConfirmed: true,
    }
    render(propsWithConfirmed)

    const confirmButton = screen.getByText('Confirm preferences')
    expect(confirmButton).toBeDisabled()
  })

  it('calls confirmCameraSettings when confirm preferences button is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const confirmButton = screen.getByText('Confirm preferences')
    await user.click(confirmButton)

    expect(mockProps.confirmCameraSettings).toHaveBeenCalledTimes(1)
  })
})
