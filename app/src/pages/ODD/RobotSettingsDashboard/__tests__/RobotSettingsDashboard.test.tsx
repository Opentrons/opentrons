import { useDispatch } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  usePostWifiConfigureMutation,
  useRobotSettingsQuery,
  useUpdateRobotSettingMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { Navigation } from '/app/organisms/ODD/Navigation'
import {
  DeviceReset,
  Devices,
  LanguageSetting,
  NetworkSettings,
  Privacy,
  RobotEncryptionKeySettingOption,
  RobotSystemVersion,
  TouchscreenBrightness,
  TouchScreenSleep,
  UpdateChannel,
} from '/app/organisms/ODD/RobotSettingsDashboard'
import { CameraPreferences } from '/app/organisms/ODD/RobotSettingsDashboard/CameraPreferences'
import { FileManager } from '/app/organisms/ODD/RobotSettingsDashboard/FileManager'
import {
  getAppLanguage,
  getConfig,
  toggleConfigValue,
  toggleDevtools,
} from '/app/redux/config'
import { getLocalRobot } from '/app/redux/discovery'
import { mockConnectedRobot } from '/app/redux/discovery/__fixtures__'
import { getRobotUpdateAvailable } from '/app/redux/robot-update'
import { useErrorRecoverySettingsToggle } from '/app/resources/errorRecovery'
import { useNetworkConnection, useWifiList } from '/app/resources/networking'
import {
  useDisableStackerSensors,
  useLEDLights,
} from '/app/resources/robot-settings'

import { RobotSettingsDashboard } from '../'

import type { UseQueryResult } from 'react-query'
import type { RobotSettingsResponse } from '@opentrons/api-client'
import type { Config } from '/app/redux/config'

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useDispatch: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))
vi.mock('/app/resources/networking', async () => {
  const actual = await vi.importActual('/app/resources/networking')
  return {
    ...actual,
    useNetworkConnection: vi.fn(),
    useWifiList: vi.fn(),
  }
})
vi.mock('/app/redux/discovery')
vi.mock('/app/redux/robot-update')
vi.mock('/app/redux/config')
vi.mock('/app/resources/robot-settings')
vi.mock('/app/resources/errorRecovery')
vi.mock('/app/organisms/ODD/Navigation')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/TouchScreenSleep')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/NetworkSettings')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/DeviceReset')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/RobotSystemVersion')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/TouchscreenBrightness')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/UpdateChannel')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/Privacy')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/LanguageSetting')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/CameraPreferences')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/Devices')
vi.mock('/app/organisms/ODD/RobotSettingsDashboard/FileManager')
vi.mock(
  '/app/organisms/ODD/RobotSettingsDashboard/RobotEncryptionKey/RobotEncryptionKeySettingOption'
)

const mockToggleLights = vi.fn()
const mockToggleER = vi.fn()
const mockToggleStackerSensors = vi.fn()
const mockUpdateRobotSetting = vi.fn()
const mockPostWifiConfigure = vi.fn()
const mockResetWifiConfigure = vi.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotSettingsDashboard />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const MOCK_DEFAULT_LANGUAGE = 'en-US'

const mockDispatch = vi.fn()

// Note kj 01/25/2023 Currently test cases only check text since this PR is bare-bones for RobotSettings Dashboard
describe('RobotSettingsDashboard', () => {
  beforeEach(() => {
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
    vi.mocked(useUpdateRobotSettingMutation).mockReturnValue({
      updateRobotSetting: mockUpdateRobotSetting,
    } as unknown as ReturnType<typeof useUpdateRobotSettingMutation>)
    vi.mocked(useRobotSettingsQuery).mockReturnValue({
      data: {
        settings: [
          {
            id: 'disableHomeOnBoot',
            title: 'Disable home on boot',
            description: 'Prevent robot from homing motors on boot',
            restart_required: false,
            value: true,
          },
        ],
      },
    } as unknown as UseQueryResult<RobotSettingsResponse>)
    vi.mocked(useLEDLights).mockReturnValue({
      lightsEnabled: false,
      toggleLights: mockToggleLights,
    })
    vi.mocked(useDisableStackerSensors).mockReturnValue({
      sensorsDisabled: false,
      toggleSensors: mockToggleStackerSensors,
    })
    vi.mocked(useNetworkConnection).mockReturnValue({} as any)
    vi.mocked(useWifiList).mockReturnValue([])
    vi.mocked(usePostWifiConfigureMutation).mockReturnValue({
      postWifiConfigure: mockPostWifiConfigure,
      mutate: mockPostWifiConfigure,
      reset: mockResetWifiConfigure,
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      status: 'idle',
    } as any)
    vi.mocked(useErrorRecoverySettingsToggle).mockReturnValue({
      isEREnabled: true,
      toggleERSettings: mockToggleER,
    })
    vi.mocked(getAppLanguage).mockReturnValue(MOCK_DEFAULT_LANGUAGE)
    vi.mocked(getConfig).mockReturnValue({
      update: { automaticallyDownloadUpdates: false },
    } as Config)
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render Navigation', () => {
    render()
    expect(vi.mocked(Navigation)).toHaveBeenCalled()
  })

  it('should render setting buttons', () => {
    render()
    screen.getByText('Robot Name')
    screen.getByText('opentrons-robot-name')
    screen.getByText('Robot System Version')
    screen.getByText('Network Settings')
    screen.getByText('Status LEDs')
    screen.getByText('Recovery Mode')
    screen.getByText(
      'Control the strip of color lights on the front of the robot.'
    )
    screen.getByText('File Manager')
    screen.getByText('Download and delete robot files.')
    screen.getByText('Touchscreen Sleep')
    screen.getByText('Touchscreen Brightness')
    screen.getByText('Privacy')
    screen.getByText('Choose what data to share with Opentrons.')
    screen.getByText('Device Reset')
    screen.getByText('Camera Preferences')
    screen.getByText('Devices')
    screen.getByText('Update Channel')
    screen.getByText('Developer Tools')
    screen.getByText('Access additional logging and feature flags.')
  })

  it('should render component when tapping robot name button', () => {
    render()
    const button = screen.getByText('Robot Name')
    fireEvent.click(button)
    screen.getByText('Robot Name')
  })

  it('should render component when tapping robot system version', () => {
    render()
    const button = screen.getByText('Robot System Version')
    fireEvent.click(button)
    expect(vi.mocked(RobotSystemVersion)).toHaveBeenCalled()
  })

  it('should render text with lights off and clicking it, calls useLEDLights', () => {
    render()
    const lights = screen.getByText('Status LEDs')
    fireEvent.click(lights)
    expect(mockToggleLights).toHaveBeenCalled()
  })

  it('should render text with lights on', () => {
    vi.mocked(useLEDLights).mockReturnValue({
      lightsEnabled: true,
      toggleLights: mockToggleLights,
    })
    render()
    expect(
      screen.getByTestId('RobotSettingButton_display_led_lights')
    ).toHaveTextContent('On')
  })

  it('should render text with auto download off and clicking it turns the setting on', () => {
    render()
    expect(
      screen.getByTestId('RobotSettingButton_automatically_download_updates')
    ).toHaveTextContent('Off')
    const autodownload = screen.getByText('Automatically download updates')
    fireEvent.click(autodownload)
    expect(mockDispatch).toHaveBeenCalledWith(
      toggleConfigValue('update.automaticallyDownloadUpdates')
    )
  })
  it('should render text with auto download on and clicking it turns the setting off', () => {
    vi.mocked(getConfig).mockReturnValue({
      update: { automaticallyDownloadUpdates: true },
    } as Config)

    render()
    expect(
      screen.getByTestId('RobotSettingButton_automatically_download_updates')
    ).toHaveTextContent('On')
    const autodownload = screen.getByText('Automatically download updates')
    fireEvent.click(autodownload)
    expect(mockDispatch).toHaveBeenCalledWith(
      toggleConfigValue('update.automaticallyDownloadUpdates')
    )
  })

  it('should render appropriate error recovery mode copy, and calls the toggle', () => {
    render()
    const toggle = screen.getByTestId('RobotSettingButton_error_recovery_mode')
    fireEvent.click(toggle)
    expect(mockToggleER).toHaveBeenCalled()
  })

  it('should render the on toggle when ER mode is enabled', () => {
    render()
    expect(
      screen.getByTestId('RobotSettingButton_error_recovery_mode')
    ).toHaveTextContent('On')
  })

  it('should render the off toggle when ER mode is disabled', () => {
    vi.mocked(useErrorRecoverySettingsToggle).mockReturnValue({
      isEREnabled: false,
      toggleERSettings: mockToggleER,
    })
    render()
    expect(
      screen.getByTestId('RobotSettingButton_error_recovery_mode')
    ).toHaveTextContent('Off')
  })

  it('should render disable stacker sensors copy, and calls toggleSensors', () => {
    render()
    screen.getByText('Disable Stacker Sensors for Labware Detection')

    const toggle = screen.getByTestId(
      'RobotSettingButton_disable_stacker_sensors'
    )
    expect(toggle).toHaveTextContent('Off')

    fireEvent.click(toggle)
    expect(mockToggleStackerSensors).toHaveBeenCalled()
  })

  it('should render on toggle with stacker sensors disabled', () => {
    vi.mocked(useDisableStackerSensors).mockReturnValue({
      sensorsDisabled: true,
      toggleSensors: mockToggleStackerSensors,
    })
    render()
    expect(
      screen.getByTestId('RobotSettingButton_disable_stacker_sensors')
    ).toHaveTextContent('On')
  })

  it('should render component when tapping network settings', () => {
    render()
    const button = screen.getByText('Network Settings')
    fireEvent.click(button)
    expect(vi.mocked(NetworkSettings)).toHaveBeenCalled()
  })

  it('should render component when tapping display touchscreen sleep', () => {
    render()
    const button = screen.getByText('Touchscreen Sleep')
    fireEvent.click(button)
    expect(vi.mocked(TouchScreenSleep)).toHaveBeenCalled()
  })

  it('should render component when tapping touchscreen brightness', () => {
    render()
    const button = screen.getByText('Touchscreen Brightness')
    fireEvent.click(button)
    expect(vi.mocked(TouchscreenBrightness)).toHaveBeenCalled()
  })

  it('should render component when tapping camera preferences', () => {
    render()
    const button = screen.getByText('Camera Preferences')
    fireEvent.click(button)
    expect(vi.mocked(CameraPreferences)).toHaveBeenCalled()
  })

  it('should render component when tapping privacy', () => {
    render()
    const button = screen.getByText('Privacy')
    fireEvent.click(button)
    expect(vi.mocked(Privacy)).toHaveBeenCalled()
  })

  it('should render component when tapping device rest', () => {
    render()
    const button = screen.getByText('Device Reset')
    fireEvent.click(button)
    expect(vi.mocked(DeviceReset)).toHaveBeenCalled()
  })

  it('should render component when tapping update channel', () => {
    render()
    const button = screen.getByText('Update Channel')
    fireEvent.click(button)
    expect(vi.mocked(UpdateChannel)).toHaveBeenCalled()
  })

  it('should render text with home gantry off', () => {
    vi.mocked(useRobotSettingsQuery).mockReturnValue({
      data: {
        settings: [
          {
            id: 'disableHomeOnBoot',
            title: 'Disable home on boot',
            description: 'Prevent robot from homing motors on boot',
            restart_required: false,
            value: false,
          },
        ],
      },
    } as unknown as UseQueryResult<RobotSettingsResponse>)
    render()
    expect(
      screen.getByTestId('RobotSettingButton_home_gantry_on_restart')
    ).toHaveTextContent('On')
  })

  it('should call a mock function when tapping enable dev tools', () => {
    render()
    const button = screen.getByText('Developer Tools')
    fireEvent.click(button)
    expect(vi.mocked(toggleDevtools)).toHaveBeenCalled()
  })

  it('should return an update available with correct text', () => {
    vi.mocked(getRobotUpdateAvailable).mockReturnValue('upgrade')
    render()
    screen.getByText('Update available')
  })

  it('should render component when tapping Language', () => {
    render()

    screen.getByText('English (US)')
    const button = screen.getByText('Language')
    fireEvent.click(button)
    expect(vi.mocked(LanguageSetting)).toHaveBeenCalled()
  })

  it('should render component when tapping File Manager', () => {
    render()

    const button = screen.getByText('File Manager')
    fireEvent.click(button)
    expect(vi.mocked(FileManager)).toHaveBeenCalled()
  })

  it('should call a mock function when tapping devices', () => {
    render()
    const button = screen.getByText('Devices')
    fireEvent.click(button)
    expect(vi.mocked(Devices)).toHaveBeenCalled()
  })

  it('should render the component when tapping show encryption key', () => {
    render()
    const button = screen.getByText('Robot encryption key')
    fireEvent.click(button)
    expect(vi.mocked(RobotEncryptionKeySettingOption)).toHaveBeenCalled()
  })
})
