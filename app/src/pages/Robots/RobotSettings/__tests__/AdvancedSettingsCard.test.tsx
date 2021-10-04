import * as React from 'react'
import { mountWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'

import * as RobotSettings from '../../../../redux/robot-settings'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import { AdvancedSettingsCard } from '../AdvancedSettingsCard'
import { UpdateFromFileControl } from '../UpdateFromFileControl'
import { OpenJupyterControl } from '../OpenJupyterControl'

jest.mock('react-router-dom', () => ({ Link: 'a' }))

jest.mock('../UpdateFromFileControl', () => ({
  UpdateFromFileControl: () => <></>,
}))

jest.mock('../../../../redux/analytics')
jest.mock('../../../../redux/robot-settings/selectors')
jest.mock('../../../../redux/shell/robot-logs/selectors')

const getRobotSettings = RobotSettings.getRobotSettings as jest.MockedFunction<
  typeof RobotSettings.getRobotSettings
>

// TODO(mc, 2020-09-09): flesh out these tests
describe('RobotSettings > AdvancedSettingsCard', () => {
  const render = (
    robot: React.ComponentProps<
      typeof AdvancedSettingsCard
    >['robot'] = mockConnectableRobot
  ): ReturnType<typeof mountWithProviders> => {
    const resetUrl = `/robots/${robot.name}/reset`
    return mountWithProviders(
      <AdvancedSettingsCard robot={robot} resetUrl={resetUrl} />,
      { i18n }
    )
  }

  beforeEach(() => {
    getRobotSettings.mockReturnValue([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render an UpdateFromFileControl', () => {
    const { wrapper } = render()
    const updateFromFile = wrapper.find(UpdateFromFileControl)

    expect(updateFromFile.prop('robotName')).toBe(mockConnectableRobot.name)
  })

  it('should render an OpenJupyterControl', () => {
    const { wrapper } = render()
    const openJupyter = wrapper.find(OpenJupyterControl)

    expect(openJupyter.prop('robotIp')).toBe(mockConnectableRobot.ip)
  })
})
