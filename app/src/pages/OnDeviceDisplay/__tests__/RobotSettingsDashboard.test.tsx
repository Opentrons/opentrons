import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { Navigation } from '../../../organisms/OnDeviceDisplay/Navigation'

import { RobotSettingsDashboard } from '../RobotSettingsDashboard'

jest.mock('../../../redux/discovery')
jest.mock('../../../redux/buildroot')
jest.mock('../../../organisms/OnDeviceDisplay/Navigation')

const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockNavigation = Navigation as jest.MockedFunction<typeof Navigation>

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

  // ToDo kj 01/25/2023 add test cases when tapping each button
})
