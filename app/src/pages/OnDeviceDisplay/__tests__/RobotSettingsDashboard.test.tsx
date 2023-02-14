import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { Navigation } from '../../../organisms/OnDeviceDisplay/Navigation'
import { NetworkSettings } from '../../../organisms/OnDeviceDisplay/RobotSettingsDashboard'

import { RobotSettingsDashboard } from '../RobotSettingsDashboard'

jest.mock('../../../redux/discovery')
jest.mock('../../../organisms/OnDeviceDisplay/Navigation')
jest.mock('../hooks/useNetworkConnection')
jest.mock(
  '../../../organisms/OnDeviceDisplay/RobotSettingsDashboard/NetworkSettings'
)

const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockNavigation = Navigation as jest.MockedFunction<typeof Navigation>
const mockNetworkSettings = NetworkSettings as jest.MockedFunction<
  typeof NetworkSettings
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
    mockNetworkSettings.mockReturnValue(<div>Mock Network Settings</div>)
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
    getByText('Display Sleep Settings')
    getByText('Display Brightness')
    getByText('Display Text Size')
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
    getByText('Robot System Version')
  })

  it('should render component when tapping network settings', () => {
    const [{ getByText }] = render()
    const button = getByText('Network Settings')
    fireEvent.click(button)
    getByText('Mock Network Settings')
  })

  it('should render component when tapping display sleep settings', () => {
    const [{ getByText }] = render()
    const button = getByText('Display Sleep Settings')
    fireEvent.click(button)
    getByText('Display Sleep Settings')
  })

  it('should render component when tapping display brightness', () => {
    const [{ getByText }] = render()
    const button = getByText('Display Brightness')
    fireEvent.click(button)
    getByText('Display Brightness')
  })

  it('should render component when tapping display text size', () => {
    const [{ getByText }] = render()
    const button = getByText('Display Text Size')
    fireEvent.click(button)
    getByText('Display Text Size')
  })

  it('should render component when tapping device rest', () => {
    const [{ getByText }] = render()
    const button = getByText('Device Reset')
    fireEvent.click(button)
    getByText('Device Reset')
  })

  // The following cases will be activate when RobotSettings PRs are ready
  // it('should render connection status - only wifi', () => {})
  // it('should render connection status - wifi + ethernet', () => {})
  // it('should render connection status - wifi + usb', () => {})
  // it('should render connection status - ethernet + usb', () => {})
  // it('should render connection status - all connected', () => {})
  // it('should render connection status - all not connected', () => {})
})
