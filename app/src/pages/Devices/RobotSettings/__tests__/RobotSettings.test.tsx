import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { RobotSettingsCalibration } from '../../../../organisms/Devices/RobotSettings/RobotSettingsCalibration'
import { RobotSettings } from '..'

jest.mock(
  '../../../../organisms/Devices/RobotSettings/RobotSettingsCalibration'
)

const mockRobotSettingsCalibration = RobotSettingsCalibration as jest.MockedFunction<
  typeof RobotSettingsCalibration
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/devices/:robotName/robot-settings/:robotSettingsTab">
        <RobotSettings />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettings', () => {
  beforeEach(() => {
    mockRobotSettingsCalibration.mockReturnValue(
      <div>Mock RobotSettingsCalibration</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a title and navigation tabs', () => {
    const [{ getByText }] = render('/devices/otie/robot-settings/calibration')

    getByText('Robot Settings')
    getByText('Calibration')
    getByText('Networking')
    getByText('Advanced')
  })

  it('renders calibration content when the calibration tab is clicked', () => {
    const [{ getByText, queryByText }] = render(
      '/devices/otie/robot-settings/advanced'
    )

    const calibrationTab = getByText('Calibration')
    expect(queryByText('Mock RobotSettingsCalibration')).toBeFalsy()
    calibrationTab.click()
    getByText('Mock RobotSettingsCalibration')
  })
})
