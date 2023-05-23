import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { getLocalRobot } from '../../../../redux/discovery'
import { toggleDevtools } from '../../../../redux/config'
import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import { Navigation } from '../../../../organisms/OnDeviceDisplay/Navigation'
import {
  DeviceReset,
  TouchScreenSleep,
  TouchscreenBrightness,
  NetworkSettings,
  RobotSystemVersion,
  TextSize,
  UpdateChannel,
} from '../../../../organisms/OnDeviceDisplay/RobotSettingsDashboard'
import { getBuildrootUpdateAvailable } from '../../../../redux/buildroot'
import { useLights } from '../../../../organisms/Devices/hooks'

import { RobotSettingsDashboard } from '..'

jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/buildroot')
jest.mock('../../../../redux/config')
jest.mock('../../hooks/useNetworkConnection')
jest.mock('../../../../organisms/OnDeviceDisplay/Navigation')
jest.mock(
  '../../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/TouchScreenSleep'
)
jest.mock(
  '../../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/NetworkSettings'
)
jest.mock(
  '../../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/DeviceReset'
)
jest.mock(
  '../../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/RobotSystemVersion'
)
jest.mock(
  '../../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/TextSize'
)
jest.mock(
  '../../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/TouchscreenBrightness'
)
jest.mock(
  '../../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/UpdateChannel'
)
jest.mock('../../../../organisms/Devices/hooks')

const mockToggleLights = jest.fn()

const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockToggleDevtools = toggleDevtools as jest.MockedFunction<
  typeof toggleDevtools
>
const mockNavigation = Navigation as jest.MockedFunction<typeof Navigation>
const mockTouchScreenSleep = TouchScreenSleep as jest.MockedFunction<
  typeof TouchScreenSleep
>
const mockNetworkSettings = NetworkSettings as jest.MockedFunction<
  typeof NetworkSettings
>
const mockDeviceReset = DeviceReset as jest.MockedFunction<typeof DeviceReset>
const mockRobotSystemVersion = RobotSystemVersion as jest.MockedFunction<
  typeof RobotSystemVersion
>
const mockTextSize = TextSize as jest.MockedFunction<typeof TextSize>
const mockTouchscreenBrightness = TouchscreenBrightness as jest.MockedFunction<
  typeof TouchscreenBrightness
>
const mockUpdateChannel = UpdateChannel as jest.MockedFunction<
  typeof UpdateChannel
>
const mockUseLights = useLights as jest.MockedFunction<typeof useLights>
const mockGetBuildrootUpdateAvailable = getBuildrootUpdateAvailable as jest.MockedFunction<
  typeof getBuildrootUpdateAvailable
>

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
    mockGetLocalRobot.mockReturnValue(mockConnectedRobot)
    mockNavigation.mockReturnValue(<div>Mock Navigation</div>)
    mockTouchScreenSleep.mockReturnValue(<div>Mock Touchscreen Sleep</div>)
    mockNetworkSettings.mockReturnValue(<div>Mock Network Settings</div>)
    mockDeviceReset.mockReturnValue(<div>Mock Device Reset</div>)
    mockRobotSystemVersion.mockReturnValue(<div>Mock Robot System Version</div>)
    mockTextSize.mockReturnValue(<div>Mock Text Size</div>)
    mockTouchscreenBrightness.mockReturnValue(
      <div>Mock Touchscreen Brightness</div>
    )
    mockUpdateChannel.mockReturnValue(<div>Mock Update Channel</div>)
    mockUseLights.mockReturnValue({
      lightsOn: false,
      toggleLights: mockToggleLights,
    })
  })

  it('should render Navigation', () => {
    const [{ getByText }] = render()
    getByText('Mock Navigation')
  })

  it('should render setting buttons', () => {
    const [{ getByText, getAllByText }] = render()
    getByText('Robot Name')
    getByText('opentrons-robot-name')
    getByText('Robot System Version')
    getByText('Network Settings')
    getByText('Display LED Lights')
    getByText(
      'Turn on or off the strip of color lights on the front of the robot.'
    )
    getByText('Touchscreen Sleep')
    getByText('Touchscreen Brightness')
    getByText('Text Size')
    getByText('Device Reset')
    getByText('Update Channel')
    getByText('Enable Developer Tools')
    getByText('Enable additional logging and allow access to feature flags.')
    expect(getAllByText('Off').length).toBe(2) // LED & DEV tools
  })

  // Note(kj: 02/03/2023) This case will be changed in a following PR
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
    getByText('Mock Robot System Version')
  })

  it('should render text with lights off and clicking it, calls useLights', () => {
    const [{ getByText }] = render()
    const lights = getByText('Display LED Lights')
    fireEvent.click(lights)
    expect(mockToggleLights).toHaveBeenCalled()
  })

  it('should render text with lights on', () => {
    mockUseLights.mockReturnValue({
      lightsOn: true,
      toggleLights: mockToggleLights,
    })
    const [{ getByText }] = render()
    getByText('On')
  })

  it('should render component when tapping network settings', () => {
    const [{ getByText }] = render()
    const button = getByText('Network Settings')
    fireEvent.click(button)
    getByText('Mock Network Settings')
  })

  it('should render component when tapping display touchscreen sleep', () => {
    const [{ getByText }] = render()
    const button = getByText('Touchscreen Sleep')
    fireEvent.click(button)
    getByText('Mock Touchscreen Sleep')
  })

  it('should render component when tapping touchscreen brightness', () => {
    const [{ getByText }] = render()
    const button = getByText('Touchscreen Brightness')
    fireEvent.click(button)
    getByText('Mock Touchscreen Brightness')
  })

  it('should render component when tapping text size', () => {
    const [{ getByText }] = render()
    const button = getByText('Text Size')
    fireEvent.click(button)
    getByText('Mock Text Size')
  })

  it('should render component when tapping device rest', () => {
    const [{ getByText }] = render()
    const button = getByText('Device Reset')
    fireEvent.click(button)
    getByText('Mock Device Reset')
  })

  it('should render component when tapping update channel', () => {
    const [{ getByText }] = render()
    const button = getByText('Update Channel')
    fireEvent.click(button)
    getByText('Mock Update Channel')
  })

  it('should call a mock function when tapping enable dev tools', () => {
    const [{ getByText }] = render()
    const button = getByText('Enable Developer Tools')
    fireEvent.click(button)
    expect(mockToggleDevtools).toHaveBeenCalled()
  })

  it('should return an update available with correct text', () => {
    mockGetBuildrootUpdateAvailable.mockReturnValue('upgrade')
    const [{ getByText }] = render()
    getByText('Update available')
  })

  // The following cases will be activate when RobotSettings PRs are ready
  it.todo('should render connection status - only wifi')
  it.todo('should render connection status - wifi + ethernet')
  it.todo('should render connection status - wifi + usb')
  it.todo('should render connection status - ethernet + usb')
  it.todo('should render connection status - all connected')
  it.todo('should render connection status - all not connected')
})
