import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAddCameraImageSettingsToRunMutation,
  useAddCameraSettingsToRunMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'
import { useToaster } from '/app/organisms/ToasterOven'
import { getCameraUsageState } from '/app/redux/protocol-runs'

import { ProtocolSetupCamera } from '..'

import type { Mock } from 'vitest'
import type { ProtocolSetupCameraProps } from '..'

vi.mock('/app/organisms/ODD/CameraSettings')
vi.mock('/app/molecules/ODDBackButton')
vi.mock('/app/redux/protocol-runs')
vi.mock('@opentrons/react-api-client')
vi.mock('/app/organisms/ToasterOven')
vi.mock(
  '/app/local-resources/access-control/useLinkedDocumentationState',
  () => ({
    useLinkedDocumentationState: () =>
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
  })
)

const render = (props: ProtocolSetupCameraProps) => {
  return renderWithProviders(<ProtocolSetupCamera {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolSetupCamera', () => {
  let mockProps: ProtocolSetupCameraProps
  let mockConfirmCamera: Mock
  let mockAddCameraImageSettings: Mock
  let mockMakeSnackbar: Mock

  beforeEach(() => {
    mockConfirmCamera = vi.fn()
    mockAddCameraImageSettings = vi.fn()

    mockMakeSnackbar = vi.fn()
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    })

    mockProps = {
      runId: 'MOCK-RUN-ID',
      isCameraRequired: true,
      confirmCameraSettings: vi.fn(),
      robotName: 'MOCK-ROBOT-NAME',
      cameraConfirmed: false,
      setSetupScreen: vi.fn(),
      storageInfo: {} as any,
    }
    vi.mocked(CameraSettings).mockImplementation(({ headerElement }) => (
      <div>
        <div>MOCK_CAMERA_SETTINGS</div>
        {headerElement}
      </div>
    ))
    vi.mocked(ODDBackButton).mockReturnValue(<div>MOCK_ODD_BACK_BUTTON</div>)
    vi.mocked(getCameraUsageState).mockReturnValue({
      enabled: true,
      recoveryEnabled: true,
      liveStreamEnabled: true,
    })
    vi.mocked(useAddCameraSettingsToRunMutation).mockReturnValue({
      mutateAsync: mockConfirmCamera,
    } as any)
    vi.mocked(useAddCameraImageSettingsToRunMutation).mockReturnValue({
      mutateAsync: mockAddCameraImageSettings,
    } as any)
  })

  it('renders CameraSettings with correct section heading', () => {
    render(mockProps)

    expect(vi.mocked(CameraSettings)).toHaveBeenCalledWith(
      expect.objectContaining({
        sectionHeadingText:
          'Review your camera preferences for this protocol run.',
      }),
      {}
    )
  })

  it('renders confirm preferences button when not confirmed', () => {
    render(mockProps)

    screen.getByText('Confirm preferences')
  })

  it('calls confirmCameraPreferences when confirm button is clicked', () => {
    render(mockProps)

    const confirmButton = screen.getByText('Confirm preferences')
    mockConfirmCamera.mockResolvedValue(undefined)
    fireEvent.click(confirmButton)

    expect(mockConfirmCamera).toHaveBeenCalledTimes(1)
  })

  it('renders enabled chip when confirmed', () => {
    const propsWithConfirmed = {
      ...mockProps,
      cameraConfirmed: true,
    }
    render(propsWithConfirmed)

    screen.getByText('Camera enabled')
  })

  it('does not render confirm button when confirmed', () => {
    const propsWithConfirmed = {
      ...mockProps,
      cameraConfirmed: true,
    }
    render(propsWithConfirmed)

    expect(screen.queryByText('Confirm preferences')).not.toBeInTheDocument()
  })

  describe('when camera is disabled and required', () => {
    beforeEach(() => {
      vi.mocked(getCameraUsageState).mockReturnValue({
        enabled: false,
        recoveryEnabled: false,
        liveStreamEnabled: false,
      })
    })

    it('blocks confirmation and shows snackbar when confirm is clicked', () => {
      render(mockProps)

      const confirmButton = screen.getByText('Confirm preferences')
      fireEvent.click(confirmButton)

      expect(mockMakeSnackbar).toHaveBeenCalledWith(
        'Camera is required to run this protocol',
        3000
      )
      expect(mockConfirmCamera).not.toHaveBeenCalled()
    })

    it('passes isCameraRequired to CameraSettings for required notification', () => {
      render(mockProps)

      expect(vi.mocked(CameraSettings)).toHaveBeenCalledWith(
        expect.objectContaining({
          isCameraRequired: true,
        }),
        {}
      )
    })
  })

  it('allows confirmation when camera is disabled but not required', () => {
    vi.mocked(getCameraUsageState).mockReturnValue({
      enabled: false,
      recoveryEnabled: false,
      liveStreamEnabled: false,
    })
    mockConfirmCamera.mockResolvedValue(undefined)
    const propsWithCameraNotRequired = {
      ...mockProps,
      isCameraRequired: false,
    }
    render(propsWithCameraNotRequired)

    const confirmButton = screen.getByText('Confirm preferences')
    fireEvent.click(confirmButton)

    expect(mockConfirmCamera).toHaveBeenCalledTimes(1)
    expect(mockMakeSnackbar).not.toHaveBeenCalled()
  })
})
