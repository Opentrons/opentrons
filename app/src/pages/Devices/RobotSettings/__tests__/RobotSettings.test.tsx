import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { Route, MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { RobotSettingsCalibration } from '../../../../organisms/RobotSettingsCalibration'
import { RobotSettingsNetworking } from '../../../../organisms/Devices/RobotSettings/RobotSettingsNetworking'
import { RobotSettingsAdvanced } from '../../../../organisms/Devices/RobotSettings/RobotSettingsAdvanced'
import { RobotSettingsPrivacy } from '../../../../organisms/Devices/RobotSettings/RobotSettingsPrivacy'
import { useRobot } from '../../../../organisms/Devices/hooks'
import { RobotSettings } from '..'
import { when } from 'vitest-when'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../../redux/discovery/__fixtures__'
import { getRobotUpdateSession } from '../../../../redux/robot-update'

vi.mock('../../../../organisms/RobotSettingsCalibration')
vi.mock('../../../../organisms/Devices/RobotSettings/RobotSettingsNetworking')
vi.mock('../../../../organisms/Devices/RobotSettings/RobotSettingsAdvanced')
vi.mock('../../../../organisms/Devices/RobotSettings/RobotSettingsPrivacy')
vi.mock('../../../../organisms/Devices/hooks')
vi.mock('../../../../redux/discovery/selectors')
vi.mock('../../../../redux/robot-update')

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
    vi.mocked(RobotSettingsPrivacy).mockReturnValue(
      <div>Mock RobotSettingsPrivacy</div>
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

  it('renders privacy content when the privacy tab is clicked', () => {
    render('/devices/otie/robot-settings/calibration')

    const PrivacyTab = screen.getByText('Privacy')
    expect(screen.queryByText('Mock RobotSettingsPrivacy')).toBeFalsy()
    fireEvent.click(PrivacyTab)
    screen.getByText('Mock RobotSettingsPrivacy')
  })
})
