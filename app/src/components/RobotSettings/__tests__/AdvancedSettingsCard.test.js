// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import * as RobotSettings from '../../../robot-settings'
import { mockConnectableRobot } from '../../../discovery/__fixtures__'
import { AdvancedSettingsCard } from '../AdvancedSettingsCard'
import { OpenJupyterControl } from '../OpenJupyterControl'

import type { State } from '../../../types'

jest.mock('react-router-dom', () => ({ Link: 'a' }))
jest.mock('../../../analytics')
jest.mock('../../../robot-settings/selectors')
jest.mock('../../../shell/robot-logs/selectors')

const getRobotSettings: JestMockFn<
  [State, string],
  $Call<typeof RobotSettings.getRobotSettings, State, string>
> = RobotSettings.getRobotSettings

// TODO(mc, 2020-09-09): flesh out these tests
describe('RobotSettings > AdvancedSettingsCard', () => {
  const render = (robot = mockConnectableRobot) => {
    const resetUrl = `/robots/${robot.name}/reset`
    return mountWithStore(
      <AdvancedSettingsCard robot={robot} resetUrl={resetUrl} />
    )
  }

  beforeEach(() => {
    getRobotSettings.mockReturnValue([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render an OpenJupyterControl', () => {
    const { wrapper } = render()
    const openJupyter = wrapper.find(OpenJupyterControl)

    expect(openJupyter.prop('robotIp')).toBe(mockConnectableRobot.ip)
  })
})
