import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { RobotSettingsAdvanced } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsAdvanced'
import { RobotSettingsCamera } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera'
import { RobotSettingsNetworking } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsNetworking'
import { RobotSettingsCalibration } from '/app/organisms/Desktop/RobotSettingsCalibration'
import { useRobot } from '/app/redux-resources/robots'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '/app/redux/discovery/__fixtures__'
import { useAccessTokenForRobot } from '/app/redux/robot-auth'
import { getRobotUpdateSession } from '/app/redux/robot-update'

import { RobotSettings } from '..'

vi.mock('/app/organisms/Desktop/RobotSettingsCalibration')
vi.mock('/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsNetworking')
vi.mock('/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsAdvanced')
vi.mock('/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/discovery/selectors')
vi.mock('/app/redux/robot-update')
vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal<typeof import('/app/redux/robot-auth')>()

  return {
    ...actual,
    useAccessTokenForRobot: vi.fn(),
  }
})
vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@opentrons/react-api-client')>()

  return {
    ...actual,
    useAccessControlEnabledQuery: vi.fn(),
  }
})

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
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(useAccessTokenForRobot).mockReturnValue(null)
    vi.mocked(RobotSettingsCalibration).mockReturnValue(
      <div>Mock RobotSettingsCalibration</div>
    )
    vi.mocked(RobotSettingsNetworking).mockReturnValue(
      <div>Mock RobotSettingsNetworking</div>
    )
    vi.mocked(RobotSettingsAdvanced).mockReturnValue(
      <div>Mock RobotSettingsAdvanced</div>
    )
    vi.mocked(RobotSettingsCamera).mockReturnValue(
      <div>Mock RobotSettingsCamera</div>
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

  it('renders camera settings content when the camera tab is clicked', () => {
    render('/devices/otie/robot-settings/advanced')

    const cameraTab = screen.getByText('Camera')
    expect(screen.queryByText('Mock RobotSettingsCamera')).toBeFalsy()
    fireEvent.click(cameraTab)
    screen.getByText('Mock RobotSettingsCamera')
  })

  it('renders advanced content when the advanced tab is clicked', () => {
    render('/devices/otie/robot-settings/calibration')

    const AdvancedTab = screen.getByText('Advanced')
    expect(screen.queryByText('Mock RobotSettingsAdvanced')).toBeFalsy()
    fireEvent.click(AdvancedTab)
    screen.getByText('Mock RobotSettingsAdvanced')
  })

  it('does not render the compliance ready tab for non-ACM devices', () => {
    render('/devices/otie/robot-settings/calibration')

    expect(screen.queryByText('Compliance Ready')).not.toBeInTheDocument()
  })

  it('renders the compliance ready tab for logged-in ACM devices', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(useAccessTokenForRobot).mockReturnValue('access-token')

    render('/devices/otie/robot-settings/calibration')

    screen.getByText('Compliance Ready')
  })

  it('redirects to networking tab if compliance ready tab is hidden', () => {
    render('/devices/otie/robot-settings/compliance-ready')

    screen.getByText('Mock RobotSettingsNetworking')
  })
})
