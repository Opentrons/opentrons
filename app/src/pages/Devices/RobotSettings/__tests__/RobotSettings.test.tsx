import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { RobotSettingsCalibration } from '../../../../organisms/RobotSettingsCalibration'
import { RobotSettingsNetworking } from '../../../../organisms/Devices/RobotSettings/RobotSettingsNetworking'
import { RobotSettingsAdvanced } from '../../../../organisms/Devices/RobotSettings/RobotSettingsAdvanced'
import { RobotSettingsPrivacy } from '../../../../organisms/Devices/RobotSettings/RobotSettingsPrivacy'
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
jest.mock('../../../../organisms/Devices/RobotSettings/RobotSettingsPrivacy')
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
const mockRobotSettingsPrivacy = RobotSettingsPrivacy as jest.MockedFunction<
  typeof RobotSettingsPrivacy
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
    mockRobotSettingsPrivacy.mockReturnValue(
      <div>Mock RobotSettingsPrivacy</div>
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

  it('redirects to device details if robot is unreachable', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockUnreachableRobot)
    const [{ getByText }] = render('/devices/otie/robot-settings/calibration')
    getByText('mock device details')
  })

  it('redirects to device details if robot is null', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(null)
    const [{ getByText }] = render('/devices/otie/robot-settings/calibration')
    getByText('mock device details')
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
    const [{ getByText }] = render('/devices/otie/robot-settings/calibration')
    getByText('Robot Settings')
  })

  it('redirects to device details if robot is reachable but server is down', () => {
    when(mockUseRobot)
      .calledWith('otie')
      .mockReturnValue({ ...mockReachableRobot, serverHealthStatus: 'notOk' })
    const [{ getByText }] = render('/devices/otie/robot-settings/calibration')
    getByText('mock device details')
  })

  it('redirects to networking tab if robot not connectable', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockReachableRobot)
    const [{ getByText }] = render('/devices/otie/robot-settings/calibration')
    getByText('Mock RobotSettingsNetworking')
  })

  it('redirects to networking tab if feature flags hidden', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockReachableRobot)
    const [{ getByText }] = render('/devices/otie/robot-settings/feature-flags')
    getByText('Mock RobotSettingsNetworking')
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

  it('defaults to calibration content when given an unspecified tab', () => {
    const [{ getByText }] = render(
      '/devices/otie/robot-settings/this-is-not-a-real-tab'
    )

    getByText('Mock RobotSettingsCalibration')
  })

  it('renders networking content when the networking tab is clicked', () => {
    const [{ getByText, queryByText }] = render(
      '/devices/otie/robot-settings/advanced'
    )

    const networkingTab = getByText('Networking')
    expect(queryByText('Mock RobotSettingsNetworking')).toBeFalsy()
    networkingTab.click()
    getByText('Mock RobotSettingsNetworking')
  })

  it('renders advanced content when the advanced tab is clicked', () => {
    const [{ getByText, queryByText }] = render(
      '/devices/otie/robot-settings/calibration'
    )

    const AdvancedTab = getByText('Advanced')
    expect(queryByText('Mock RobotSettingsAdvanced')).toBeFalsy()
    AdvancedTab.click()
    getByText('Mock RobotSettingsAdvanced')
  })

  it('renders privacy content when the privacy tab is clicked', () => {
    const [{ getByText, queryByText }] = render(
      '/devices/otie/robot-settings/calibration'
    )

    const PrivacyTab = getByText('Privacy')
    expect(queryByText('Mock RobotSettingsPrivacy')).toBeFalsy()
    PrivacyTab.click()
    getByText('Mock RobotSettingsPrivacy')
  })
})
