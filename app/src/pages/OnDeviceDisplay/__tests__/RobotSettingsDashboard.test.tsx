import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { Navigation } from '../../../organisms/OnDeviceDisplay/Navigation'
import {
  DeviceReset,
  TouchScreenSleep,
  NetworkSettings,
  RobotSystemVersion,
  DisplayTextSize,
} from '../../../organisms/OnDeviceDisplay/RobotSettingsDashboard'

import { RobotSettingsDashboard } from '../RobotSettingsDashboard'

jest.mock('../../../redux/discovery')
jest.mock('../../../redux/buildroot')
jest.mock('../hooks/useNetworkConnection')
jest.mock('../../../organisms/OnDeviceDisplay/Navigation')
jest.mock(
  '../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/TouchScreenSleep'
)
jest.mock(
  '../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/NetworkSettings'
)
jest.mock(
  '../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/DeviceReset'
)
jest.mock(
  '../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/RobotSystemVersion'
)
jest.mock(
  '../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/DisplayTextSize'
)

const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
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
const mockDisplayTextSize = DisplayTextSize as jest.MockedFunction<
  typeof DisplayTextSize
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
    mockDisplayTextSize.mockReturnValue(<div>Mock Display Text Size</div>)
  })

  it('should render Navigation', () => {
    const [{ getByText }] = render()
    getByText('Mock Navigation')
  })

  it('should render setting buttons', () => {
    const [{ getByText }] = render()
    getByText('Robot Name')
    getByText('opentrons-robot-name')
    getByText('Robot System Version')
    getByText('Network Settings')
    getByText('Display LED Lights')
    getByText('Touchscreen Sleep')
    getByText('Touchscreen Brightness')
    getByText('Text Size')
    getByText('Device Reset')
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
    getByText('Touchscreen Brightness')
  })

  it('should render component when tapping text size', () => {
    const [{ getByText }] = render()
    const button = getByText('Text Size')
    fireEvent.click(button)
    getByText('Text Size')
  })

  it('should render component when tapping device rest', () => {
    const [{ getByText }] = render()
    const button = getByText('Device Reset')
    fireEvent.click(button)
    getByText('Mock Device Reset')
  })

  // The following cases will be activate when RobotSettings PRs are ready
  // it('should render connection status - only wifi', () => {})
  // it('should render connection status - wifi + ethernet', () => {})
  // it('should render connection status - wifi + usb', () => {})
  // it('should render connection status - ethernet + usb', () => {})
  // it('should render connection status - all connected', () => {})
  // it('should render connection status - all not connected', () => {})
})
