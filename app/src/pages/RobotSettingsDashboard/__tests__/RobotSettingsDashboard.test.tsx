import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'

import { i18n } from '../../../i18n'
import { getRobotSettings } from '../../../redux/robot-settings'
import { getLocalRobot } from '../../../redux/discovery'
import { toggleDevtools, toggleHistoricOffsets } from '../../../redux/config'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { Navigation } from '../../../organisms/Navigation'
import {
  DeviceReset,
  TouchScreenSleep,
  TouchscreenBrightness,
  NetworkSettings,
  Privacy,
  RobotSystemVersion,
  UpdateChannel,
} from '../../../organisms/RobotSettingsDashboard'
import { getRobotUpdateAvailable } from '../../../redux/robot-update'
import { useNetworkConnection } from '../../../resources/networking/hooks/useNetworkConnection'
import { useLEDLights } from '../../../organisms/Devices/hooks'

import { RobotSettingsDashboard } from '../../../pages/RobotSettingsDashboard'

vi.mock('../../../redux/discovery')
vi.mock('../../../redux/robot-update')
vi.mock('../../../redux/config')
vi.mock('../../../redux/robot-settings')
vi.mock('../../../resources/networking/hooks/useNetworkConnection')
vi.mock('../../../organisms/Navigation')
vi.mock('../../../organisms/RobotSettingsDashboard/TouchScreenSleep')
vi.mock('../../../organisms/RobotSettingsDashboard/NetworkSettings')
vi.mock('../../../organisms/RobotSettingsDashboard/DeviceReset')
vi.mock('../../../organisms/RobotSettingsDashboard/RobotSystemVersion')
vi.mock('../../../organisms/RobotSettingsDashboard/TouchscreenBrightness')
vi.mock('../../../organisms/RobotSettingsDashboard/UpdateChannel')
vi.mock('../../../organisms/Devices/hooks')
vi.mock('../../../organisms/RobotSettingsDashboard/Privacy')

const mockToggleLights = vi.fn()

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

// Note kj 01/25/2023 Currently test cases only check text since this PR is bare-bones for RobotSettings Dashboard
describe('RobotSettingsDashboard', () => {
  beforeEach(() => {
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
    vi.mocked(getRobotSettings).mockReturnValue([
      {
        id: 'disableHomeOnBoot',
        title: 'Disable home on boot',
        description: 'Prevent robot from homing motors on boot',
        restart_required: false,
        value: true,
      },
    ])
    vi.mocked(useLEDLights).mockReturnValue({
      lightsEnabled: false,
      toggleLights: mockToggleLights,
    })
    vi.mocked(useNetworkConnection).mockReturnValue({} as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render Navigation', () => {
    render()
    expect(vi.mocked(Navigation)).toHaveBeenCalled()
  })

  it('should render setting buttons', () => {
    const [{ getByText }] = render()
    getByText('Robot Name')
    getByText('opentrons-robot-name')
    getByText('Robot System Version')
    getByText('Network Settings')
    getByText('Status LEDs')
    getByText('Control the strip of color lights on the front of the robot.')
    getByText('Touchscreen Sleep')
    getByText('Touchscreen Brightness')
    getByText('Privacy')
    getByText('Choose what data to share with Opentrons.')
    getByText('Device Reset')
    getByText('Update Channel')
    getByText('Apply Labware Offsets')
    getByText('Use stored data when setting up a protocol.')
    getByText('Developer Tools')
    getByText('Access additional logging and feature flags.')
  })

  it('should render component when tapping robot name button', () => {
    const [{ getByText }] = render()
    const button = getByText('Robot Name')
    fireEvent.click(button)
    getByText('Robot Name')
  })

  it('should render component when tapping robot system version', () => {
    const [{ getByText }] = render()
    const button = getByText('Robot System Version')
    fireEvent.click(button)
    expect(vi.mocked(RobotSystemVersion)).toHaveBeenCalled()
  })

  it('should render text with lights off and clicking it, calls useLEDLights', () => {
    const [{ getByText }] = render()
    const lights = getByText('Status LEDs')
    fireEvent.click(lights)
    expect(mockToggleLights).toHaveBeenCalled()
  })

  it('should render text with lights on', () => {
    vi.mocked(useLEDLights).mockReturnValue({
      lightsEnabled: true,
      toggleLights: mockToggleLights,
    })
    const [{ getByTestId }] = render()
    expect(
      getByTestId('RobotSettingButton_display_led_lights')
    ).toHaveTextContent('On')
  })

  it('should render component when tapping network settings', () => {
    const [{ getByText }] = render()
    const button = getByText('Network Settings')
    fireEvent.click(button)
    expect(vi.mocked(NetworkSettings)).toHaveBeenCalled()
  })

  it('should render component when tapping display touchscreen sleep', () => {
    const [{ getByText }] = render()
    const button = getByText('Touchscreen Sleep')
    fireEvent.click(button)
    expect(vi.mocked(TouchScreenSleep)).toHaveBeenCalled()
  })

  it('should render component when tapping touchscreen brightness', () => {
    const [{ getByText }] = render()
    const button = getByText('Touchscreen Brightness')
    fireEvent.click(button)
    expect(vi.mocked(TouchscreenBrightness)).toHaveBeenCalled()
  })

  it('should render component when tapping privacy', () => {
    const [{ getByText }] = render()
    const button = getByText('Privacy')
    fireEvent.click(button)
    expect(vi.mocked(Privacy)).toHaveBeenCalled()
  })

  it('should render component when tapping device rest', () => {
    const [{ getByText }] = render()
    const button = getByText('Device Reset')
    fireEvent.click(button)
    expect(vi.mocked(DeviceReset)).toHaveBeenCalled()
  })

  it('should render component when tapping update channel', () => {
    const [{ getByText }] = render()
    const button = getByText('Update Channel')
    fireEvent.click(button)
    expect(vi.mocked(UpdateChannel)).toHaveBeenCalled()
  })

  it('should render text with home gantry off', () => {
    vi.mocked(getRobotSettings).mockReturnValue([
      {
        id: 'disableHomeOnBoot',
        title: 'Disable home on boot',
        description: 'Prevent robot from homing motors on boot',
        restart_required: false,
        value: false,
      },
    ])
    const [{ getByTestId }] = render()
    expect(
      getByTestId('RobotSettingButton_home_gantry_on_restart')
    ).toHaveTextContent('On')
  })

  it('should call a mock function when tapping enable historic offset', () => {
    const [{ getByText }] = render()
    const button = getByText('Apply Labware Offsets')
    fireEvent.click(button)
    expect(vi.mocked(toggleHistoricOffsets)).toHaveBeenCalled()
  })

  it('should call a mock function when tapping enable dev tools', () => {
    const [{ getByText }] = render()
    const button = getByText('Developer Tools')
    fireEvent.click(button)
    expect(vi.mocked(toggleDevtools)).toHaveBeenCalled()
  })

  it('should return an update available with correct text', () => {
    vi.mocked(getRobotUpdateAvailable).mockReturnValue('upgrade')
    const [{ getByText }] = render()
    getByText('Update available')
  })
})
