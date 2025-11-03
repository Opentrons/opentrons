import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'
import { getCameraUsageState } from '/app/redux/protocol-runs'

import { ProtocolSetupCamera } from '..'

import type { ProtocolSetupCameraProps } from '..'

vi.mock('/app/organisms/ODD/CameraSettings')
vi.mock('/app/molecules/ODDBackButton')
vi.mock('/app/redux/protocol-runs')

const render = (props: ProtocolSetupCameraProps) => {
  return renderWithProviders(<ProtocolSetupCamera {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolSetupCamera', () => {
  let mockProps: ProtocolSetupCameraProps

  beforeEach(() => {
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
    fireEvent.click(confirmButton)

    expect(mockProps.confirmCameraSettings).toHaveBeenCalledTimes(1)
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
})
