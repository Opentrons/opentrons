import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { RobotSettingsDashboard } from '../RobotSettingsDashboard'

jest.mock('../../../redux/discovery')

const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
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
  })

  it('should render text', () => {
    const [{ getByText }] = render()
    getByText('Robot Name')
    getByText(mockConnectedRobot.name)
    getByText('Robot System Version')
    getByText('Network Settings')
    getByText('Display Sleep Settings')
    getByText('Display Brightness')
    getByText('Display Text Size')
    getByText('Device Reset')
  })

  // ToDo kj 01/25/2023 add test cases when tapping each button
})
