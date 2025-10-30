import { useNavigate } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { SetupRunCameraControls } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraControls'
import { SetupRunCameraUsage } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraSettings'
import { useRobotStorageInfo } from '/app/resources/health/useIsImageStorageLow'

import { SetupCamera } from '..'

import type { Mock } from 'vitest'
import type { SetupCameraProps } from '..'

vi.mock('react-router-dom')
vi.mock(
  '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraControls'
)
vi.mock(
  '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraSettings'
)
vi.mock('/app/resources/health/useIsImageStorageLow')

const render = (props: SetupCameraProps) => {
  return renderWithProviders(<SetupCamera {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupCamera', () => {
  let mockProps: SetupCameraProps
  let mockNavigate: Mock

  beforeEach(() => {
    mockNavigate = vi.fn()
    mockProps = {
      isCameraRequired: true,
      cameraSettings: {
        cameraEnabled: true,
        errorRecoveryCameraEnabled: true,
        liveStreamEnabled: true,
      },
      runId: 'MOCK-RUN-ID',
      cameraConfirmed: false,
      confirmCameraSettings: vi.fn(),
      robotName: 'test-robot',
    }
    vi.mocked(SetupRunCameraControls).mockReturnValue(
      <div>MOCK_SETUP_RUN_CAMERA_CONTROLS</div>
    )
    vi.mocked(SetupRunCameraUsage).mockReturnValue(
      <div>MOCK_SETUP_RUN_CAMERA_USAGE</div>
    )
    vi.mocked(useRobotStorageInfo).mockReturnValue({
      isImageStorageLow: true,
      isSystemStorageLow: true,
      imageDirSizeMb: 1000,
      robotDiskAvailableMb: 1000,
      isLoading: false,
    })
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
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
      cameraSettings: {
        ...mockProps.cameraSettings,
        cameraEnabled: false,
      } as any,
    }
    render(propsWithCameraDisabled)

    screen.getByText('Disabled')
  })

  it('does not render camera required notification when camera is enabled', () => {
    render(mockProps)

    expect(screen.queryByText('Camera is required.')).not.toBeInTheDocument()
  })

  it('renders camera required notification when camera is disabled', () => {
    const propsWithCameraDisabled = {
      ...mockProps,
      cameraSettings: {
        ...mockProps.cameraSettings,
        cameraEnabled: false,
      } as any,
    }
    render(propsWithCameraDisabled)

    screen.getByText('Camera is required.')
    screen.getByText('Enable the camera to run this protocol.')
  })

  it('does not render SetupRunCameraUsage when camera is disabled', () => {
    const propsWithCameraDisabled = {
      ...mockProps,
      cameraSettings: {
        ...mockProps.cameraSettings,
        cameraEnabled: false,
      } as any,
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
      cameraSettings: {
        ...mockProps.cameraSettings,
        cameraEnabled: false,
      } as any,
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

  it('renders the image storage almost full notification if storage is almost full', () => {
    render(mockProps)

    screen.getByText('Image storage almost full.')
    screen.getByText(
      'The run may fail if storage space is not freed up by clearing images from a previous run record.'
    )

    const link = screen.getByText('View Recent Runs')
    fireEvent.click(link)

    expect(mockNavigate).toHaveBeenCalledWith(
      '/devices/test-robot/#recent-protocol-runs'
    )
  })
})
