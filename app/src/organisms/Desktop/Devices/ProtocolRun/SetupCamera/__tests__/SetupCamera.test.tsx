import { useNavigate } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAddCameraImageSettingsToRunMutation,
  useAddCameraSettingsToRunMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { SetupRunCameraControls } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraControls'
import { SetupRunCameraUsage } from '/app/organisms/Desktop/Devices/ProtocolRun/SetupCamera/SetupRunCameraSettings'
import { useIsFlex } from '/app/redux-resources/robots'
import { useFeatureFlag } from '/app/redux/config'
import {
  getCameraImageSettings,
  getCameraUsageState,
} from '/app/redux/protocol-runs'
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
vi.mock('/app/redux/discovery/selectors')
vi.mock('/app/redux/config')
vi.mock('/app/redux/protocol-runs')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/robots')
vi.mock(
  '/app/local-resources/access-control/useLinkedDocumentationState',
  () => ({
    useLinkedDocumentationState: () =>
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
  })
)

const render = (props: SetupCameraProps) => {
  return renderWithProviders(<SetupCamera {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupCamera', () => {
  let mockProps: SetupCameraProps
  let mockNavigate: Mock
  let mockAddCameraToRun: Mock
  let mockAddCameraImageToRun: Mock

  beforeEach(() => {
    mockNavigate = vi.fn()
    mockAddCameraToRun = vi.fn().mockResolvedValue(undefined)
    mockAddCameraImageToRun = vi.fn().mockResolvedValue(undefined)
    mockProps = {
      isCameraRequired: true,
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
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    vi.mocked(getCameraUsageState).mockReturnValue({
      enabled: true,
      recoveryEnabled: true,
      liveStreamEnabled: true,
    })
    vi.mocked(getCameraImageSettings as Mock).mockReturnValue(null)
    vi.mocked(useAddCameraSettingsToRunMutation).mockReturnValue({
      mutateAsync: mockAddCameraToRun,
    } as any)
    vi.mocked(useAddCameraImageSettingsToRunMutation).mockReturnValue({
      mutateAsync: mockAddCameraImageToRun,
    } as any)
    vi.mocked(useIsFlex).mockReturnValue(true)
  })

  it('renders camera status section for the Flex', () => {
    render(mockProps)

    screen.getByText('Camera Status')
    screen.getByText(
      'The deck camera offers live video monitoring during protocol runs and can capture images manually, automatically, or when an error occurs for easier troubleshooting.'
    )
  })

  it('renders camera status section for the OT-2', () => {
    vi.mocked(useIsFlex).mockReturnValue(false)
    render(mockProps)

    screen.getByText('Camera Status')
    screen.getByText(
      'The deck camera can capture images manually, automatically, or when an error occurs for easier troubleshooting.'
    )
  })

  it('renders enabled status when camera is enabled', () => {
    render(mockProps)

    screen.getByText('Enabled')
  })

  it('renders disabled status when camera is disabled', () => {
    vi.mocked(getCameraUsageState).mockReturnValue({
      enabled: false,
      recoveryEnabled: true,
      liveStreamEnabled: true,
    })

    render(mockProps)

    screen.getByText('Disabled')
  })

  it('does not render camera required notification when camera is enabled', () => {
    render(mockProps)

    expect(
      screen.queryByText('Camera is required to run this protocol.')
    ).not.toBeInTheDocument()
  })

  it('renders camera required notification when camera is disabled', () => {
    vi.mocked(getCameraUsageState).mockReturnValue({
      enabled: false,
      recoveryEnabled: true,
      liveStreamEnabled: true,
    })

    render(mockProps)

    screen.getByText('Camera is required to run this protocol.')
    screen.getByText('Enable the camera to start the run.')
  })

  it('does not render SetupRunCameraUsage when camera is disabled', () => {
    vi.mocked(getCameraUsageState).mockReturnValue({
      enabled: false,
      recoveryEnabled: true,
      liveStreamEnabled: true,
    })

    render(mockProps)

    expect(
      screen.queryByText('MOCK_SETUP_RUN_CAMERA_USAGE')
    ).not.toBeInTheDocument()
  })

  it('renders SetupRunCameraControls when camera is enabled', () => {
    render(mockProps)

    screen.getByText('MOCK_SETUP_RUN_CAMERA_CONTROLS')
  })

  it('does not render SetupRunCameraControls when camera is disabled', () => {
    vi.mocked(getCameraUsageState).mockReturnValue({
      enabled: false,
      recoveryEnabled: true,
      liveStreamEnabled: true,
    })

    render(mockProps)

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

  it('calls confirmCameraSettings when confirm preferences button is clicked', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const confirmButton = screen.getByText('Confirm preferences')
    await user.click(confirmButton)

    expect(mockAddCameraToRun).toHaveBeenCalledTimes(1)
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
