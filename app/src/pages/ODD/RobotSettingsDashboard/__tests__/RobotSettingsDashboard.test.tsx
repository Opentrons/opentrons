import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { getRobotSettings } from '/app/redux/robot-settings'
import { getLocalRobot } from '/app/redux/discovery'
import { toggleDevtools, toggleHistoricOffsets } from '/app/redux/config'
import { mockConnectedRobot } from '/app/redux/discovery/__fixtures__'
import { Navigation } from '../../../../organisms/Navigation'
import {
  DeviceReset,
  TouchScreenSleep,
  TouchscreenBrightness,
  NetworkSettings,
  Privacy,
  RobotSystemVersion,
  UpdateChannel,
} from '../../../../organisms/ODD/RobotSettingsDashboard'
import { getRobotUpdateAvailable } from '/app/redux/robot-update'
import { useNetworkConnection } from '../../../../resources/networking/hooks/useNetworkConnection'
import { useLEDLights } from '../../../../organisms/Devices/hooks'

import { RobotSettingsDashboard } from '../'

vi.mock('/app/redux/discovery')
vi.mock('/app/redux/robot-update')
vi.mock('/app/redux/config')
vi.mock('/app/redux/robot-settings')
vi.mock('../../../../resources/networking/hooks/useNetworkConnection')
vi.mock('../../../../organisms/Navigation')
vi.mock('../../../../organisms/ODD/RobotSettingsDashboard/TouchScreenSleep')
vi.mock('../../../../organisms/ODD/RobotSettingsDashboard/NetworkSettings')
vi.mock('../../../../organisms/ODD/RobotSettingsDashboard/DeviceReset')
vi.mock('../../../../organisms/ODD/RobotSettingsDashboard/RobotSystemVersion')
vi.mock(
  '../../../../organisms/ODD/RobotSettingsDashboard/TouchscreenBrightness'
)
vi.mock('../../../../organisms/ODD/RobotSettingsDashboard/UpdateChannel')
vi.mock('../../../../organisms/Devices/hooks')
vi.mock('../../../../organisms/ODD/RobotSettingsDashboard/Privacy')

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
    render()
    screen.getByText('Robot Name')
    screen.getByText('opentrons-robot-name')
    screen.getByText('Robot System Version')
    screen.getByText('Network Settings')
    screen.getByText('Status LEDs')
    screen.getByText(
      'Control the strip of color lights on the front of the robot.'
    )
    screen.getByText('Touchscreen Sleep')
    screen.getByText('Touchscreen Brightness')
    screen.getByText('Privacy')
    screen.getByText('Choose what data to share with Opentrons.')
    screen.getByText('Device Reset')
    screen.getByText('Update Channel')
    screen.getByText('Apply Labware Offsets')
    screen.getByText('Use stored data when setting up a protocol.')
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
    vi.mocked(getRobotSettings).mockReturnValue([
      {
        id: 'disableHomeOnBoot',
        title: 'Disable home on boot',
        description: 'Prevent robot from homing motors on boot',
        restart_required: false,
        value: false,
      },
    ])
    render()
    expect(
      screen.getByTestId('RobotSettingButton_home_gantry_on_restart')
    ).toHaveTextContent('On')
  })

  it('should call a mock function when tapping enable historic offset', () => {
    render()
    const button = screen.getByText('Apply Labware Offsets')
    fireEvent.click(button)
    expect(vi.mocked(toggleHistoricOffsets)).toHaveBeenCalled()
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
})
