import * as React from 'react'
import { Route } from 'react-router'
import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { RobotSettingsCalibration } from '../../../../organisms/RobotSettingsCalibration'
import { RobotSettingsNetworking } from '../../../../organisms/Devices/RobotSettings/RobotSettingsNetworking'
import { RobotSettingsAdvanced } from '../../../../organisms/Devices/RobotSettings/RobotSettingsAdvanced'
import { useRobot } from '../../../../organisms/Devices/hooks'
import { RobotSettings } from '..'
import { when } from 'jest-when'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../../redux/discovery/__fixtures__'
import { getRobotUpdateSession } from '../../../../redux/robot-update'

jest.mock('../../../../organisms/RobotSettingsCalibration')
jest.mock('../../../../organisms/Devices/RobotSettings/RobotSettingsNetworking')
jest.mock('../../../../organisms/Devices/RobotSettings/RobotSettingsAdvanced')
jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../redux/discovery/selectors')
jest.mock('../../../../redux/robot-update')

const mockRobotSettingsCalibration = RobotSettingsCalibration as jest.MockedFunction<
  typeof RobotSettingsCalibration
>
const mockRobotSettingsNetworking = RobotSettingsNetworking as jest.MockedFunction<
  typeof RobotSettingsNetworking
>
const mockRobotSettingsAdvanced = RobotSettingsAdvanced as jest.MockedFunction<
  typeof RobotSettingsAdvanced
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>

const mockGetRobotUpdateSession = getRobotUpdateSession as jest.MockedFunction<
  typeof getRobotUpdateSession
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/devices/:robotName/robot-settings/:robotSettingsTab">
        <RobotSettings />
      </Route>
      <Route path="/devices/:robotName">
        <div>mock device details</div>
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettings', () => {
  beforeEach(() => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockConnectableRobot)
    mockRobotSettingsCalibration.mockReturnValue(
      <div>Mock RobotSettingsCalibration</div>
    )
    mockRobotSettingsNetworking.mockReturnValue(
      <div>Mock RobotSettingsNetworking</div>
    )
    mockRobotSettingsAdvanced.mockReturnValue(
      <div>Mock RobotSettingsAdvanced</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a title and navigation tabs', () => {
    render('/devices/otie/robot-settings/calibration')

    screen.getByText('Robot Settings')
    screen.getByText('Calibration')
    screen.getByText('Networking')
    screen.getByText('Advanced')
  })

  it('redirects to device details if robot is unreachable', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockUnreachableRobot)
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('mock device details')
  })

  it('redirects to device details if robot is null', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(null)
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('mock device details')
  })

  it('does NOT redirect to device details if robot is null but a robot update session is active', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(null)
    mockGetRobotUpdateSession.mockReturnValue({
      robotName: 'some robot',
      fileInfo: null,
      token: null,
      pathPrefix: null,
      step: null,
      stage: null,
      progress: null,
      error: null,
    })
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('Robot Settings')
  })

  it('redirects to device details if robot is reachable but server is down', () => {
    when(mockUseRobot)
      .calledWith('otie')
      .mockReturnValue({ ...mockReachableRobot, serverHealthStatus: 'notOk' })
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('mock device details')
  })

  it('redirects to networking tab if robot not connectable', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockReachableRobot)
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('Mock RobotSettingsNetworking')
  })

  it('redirects to networking tab if feature flags hidden', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockReachableRobot)
    render('/devices/otie/robot-settings/feature-flags')
    screen.getByText('Mock RobotSettingsNetworking')
  })

  it('renders calibration content when the calibration tab is clicked', () => {
    render('/devices/otie/robot-settings/advanced')

    const calibrationTab = screen.getByText('Calibration')
    expect(screen.queryByText('Mock RobotSettingsCalibration')).toBeFalsy()
    fireEvent.click(calibrationTab)
    screen.getByText('Mock RobotSettingsCalibration')
  })

  it('defaults to calibration content when given an unspecified tab', () => {
    render('/devices/otie/robot-settings/this-is-not-a-real-tab')

    screen.getByText('Mock RobotSettingsCalibration')
  })

  it('renders networking content when the networking tab is clicked', () => {
    render('/devices/otie/robot-settings/advanced')

    const networkingTab = screen.getByText('Networking')
    expect(screen.queryByText('Mock RobotSettingsNetworking')).toBeFalsy()
    fireEvent.click(networkingTab)
    screen.getByText('Mock RobotSettingsNetworking')
  })

  it('renders advanced content when the advanced tab is clicked', () => {
    render('/devices/otie/robot-settings/calibration')

    const AdvancedTab = screen.getByText('Advanced')
    expect(screen.queryByText('Mock RobotSettingsAdvanced')).toBeFalsy()
    fireEvent.click(AdvancedTab)
    screen.getByText('Mock RobotSettingsAdvanced')
  })
})
