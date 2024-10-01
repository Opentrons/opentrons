import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { Route, MemoryRouter, Routes } from 'react-router-dom'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { RobotSettingsCalibration } from '/app/organisms/Desktop/RobotSettingsCalibration'
import { RobotSettingsNetworking } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsNetworking'
import { RobotSettingsAdvanced } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsAdvanced'
import { useRobot } from '/app/redux-resources/robots'
import { RobotSettings } from '..'
import { when } from 'vitest-when'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '/app/redux/discovery/__fixtures__'
import { getRobotUpdateSession } from '/app/redux/robot-update'

vi.mock('/app/organisms/Desktop/RobotSettingsCalibration')
vi.mock('/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsNetworking')
vi.mock('/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsAdvanced')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/discovery/selectors')
vi.mock('/app/redux/robot-update')

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Routes>
        <Route
          path="/devices/:robotName/robot-settings/:robotSettingsTab"
          element={<RobotSettings />}
        />
        <Route
          path="/devices/:robotName"
          element={<div>mock device details</div>}
        />
      </Routes>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSettings', () => {
  beforeEach(() => {
    when(vi.mocked(useRobot))
      .calledWith('otie')
      .thenReturn(mockConnectableRobot)
    vi.mocked(RobotSettingsCalibration).mockReturnValue(
      <div>Mock RobotSettingsCalibration</div>
    )
    vi.mocked(RobotSettingsNetworking).mockReturnValue(
      <div>Mock RobotSettingsNetworking</div>
    )
    vi.mocked(RobotSettingsAdvanced).mockReturnValue(
      <div>Mock RobotSettingsAdvanced</div>
    )
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders a title and navigation tabs', () => {
    render('/devices/otie/robot-settings/calibration')

    screen.getByText('Robot Settings')
    screen.getByText('Calibration')
    screen.getByText('Networking')
    screen.getByText('Advanced')
  })

  it('redirects to device details if robot is unreachable', () => {
    when(vi.mocked(useRobot))
      .calledWith('otie')
      .thenReturn(mockUnreachableRobot)
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('mock device details')
  })

  it('redirects to device details if robot is null', () => {
    when(vi.mocked(useRobot)).calledWith('otie').thenReturn(null)
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('mock device details')
  })

  it('does NOT redirect to device details if robot is null but a robot update session is active', () => {
    when(vi.mocked(useRobot)).calledWith('otie').thenReturn(null)
    vi.mocked(getRobotUpdateSession).mockReturnValue({
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
    when(vi.mocked(useRobot))
      .calledWith('otie')
      .thenReturn({ ...mockReachableRobot, serverHealthStatus: 'notOk' })
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('mock device details')
  })

  it('redirects to networking tab if robot not connectable', () => {
    when(vi.mocked(useRobot)).calledWith('otie').thenReturn(mockReachableRobot)
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('Mock RobotSettingsNetworking')
  })

  it('redirects to networking tab if feature flags hidden', () => {
    when(vi.mocked(useRobot)).calledWith('otie').thenReturn(mockReachableRobot)
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
