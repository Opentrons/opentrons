import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { when } from 'vitest-when'
import { vi, describe, beforeEach, afterEach, expect, it } from 'vitest'

import { renderWithProviders } from '../../__testing-utils__'
import { i18n } from '../../i18n'
import { Breadcrumbs } from '../../organisms/Breadcrumbs'
import { CalibrationDashboard } from '../../pages/Desktop/Devices/CalibrationDashboard'
import { DeviceDetails } from '../../pages/Desktop/Devices/DeviceDetails'
import { DevicesLanding } from '../../pages/Desktop/Devices/DevicesLanding'
import { ProtocolsLanding } from '../../pages/Desktop/Protocols/ProtocolsLanding'
import { ProtocolRunDetails } from '../../pages/Desktop/Devices/ProtocolRunDetails'
import { RobotSettings } from '../../pages/Desktop/Devices/RobotSettings'
import { GeneralSettings } from '../../pages/AppSettings/GeneralSettings'
import { AlertsModal } from '../../organisms/Alerts/AlertsModal'
import { useFeatureFlag } from '../../redux/config'
import { useIsFlex } from '../../organisms/Devices/hooks'
import { ProtocolTimeline } from '../../pages/Desktop/Protocols/ProtocolDetails/ProtocolTimeline'
import { useSoftwareUpdatePoll } from '../hooks'
import { DesktopApp } from '../DesktopApp'

vi.mock('../../organisms/Breadcrumbs')
vi.mock('../../organisms/Devices/hooks')
vi.mock('../../pages/AppSettings/GeneralSettings')
vi.mock('../../pages/Desktop/Devices/CalibrationDashboard')
vi.mock('../../pages/Desktop/Devices/DeviceDetails')
vi.mock('../../pages/Desktop/Devices/DevicesLanding')
vi.mock('../../pages/Desktop/Protocols/ProtocolsLanding')
vi.mock('../../pages/Desktop/Devices/ProtocolRunDetails')
vi.mock('../../pages/Desktop/Devices/RobotSettings')
vi.mock('../../organisms/Alerts/AlertsModal')
vi.mock('../../pages/Desktop/Protocols/ProtocolDetails/ProtocolTimeline')
vi.mock('../../redux/config')
vi.mock('../hooks')

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <DesktopApp />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('DesktopApp', () => {
  beforeEach(() => {
    when(vi.mocked(useFeatureFlag))
      .calledWith('protocolTimeline')
      .thenReturn(true)
    vi.mocked(CalibrationDashboard).mockReturnValue(
      <div>Mock CalibrationDashboard</div>
    )
    vi.mocked(DeviceDetails).mockReturnValue(<div>Mock DeviceDetails</div>)
    vi.mocked(DevicesLanding).mockReturnValue(<div>Mock DevicesLanding</div>)
    vi.mocked(ProtocolsLanding).mockReturnValue(
      <div>Mock ProtocolsLanding</div>
    )
    vi.mocked(ProtocolRunDetails).mockReturnValue(
      <div>Mock ProtocolRunDetails</div>
    )
    vi.mocked(ProtocolTimeline).mockReturnValue(
      <div>Mock ProtocolTimeline</div>
    )
    vi.mocked(RobotSettings).mockReturnValue(<div>Mock RobotSettings</div>)
    vi.mocked(GeneralSettings).mockReturnValue(<div>Mock AppSettings</div>)
    vi.mocked(Breadcrumbs).mockReturnValue(<div>Mock Breadcrumbs</div>)
    vi.mocked(AlertsModal).mockReturnValue(<></>)
    vi.mocked(useIsFlex).mockReturnValue(true)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('renders a Breadcrumbs component', () => {
    render('/devices')
    screen.getByText('Mock Breadcrumbs')
  })

  it('renders an AppSettings component', () => {
    render('/app-settings/general')
    screen.getByText('Mock AppSettings')
  })

  it('renders a DevicesLanding component from /devices', () => {
    render('/devices')
    screen.getByText('Mock DevicesLanding')
  })

  it('renders a DeviceDetails component from /devices/:robotName', () => {
    render('/devices/otie')
    screen.getByText('Mock DeviceDetails')
  })

  it('renders a RobotSettings component from /devices/:robotName/robot-settings/:robotSettingsTab', () => {
    render('/devices/otie/robot-settings/calibration')
    screen.getByText('Mock RobotSettings')
  })

  it('renders a CalibrationDashboard component from /devices/:robotName/robot-settings/calibration/dashboard', () => {
    render('/devices/otie/robot-settings/calibration/dashboard')
    screen.getByText('Mock CalibrationDashboard')
  })

  it('renders a ProtocolsLanding component from /protocols', () => {
    render('/protocols')
    screen.getByText('Mock ProtocolsLanding')
  })

  it('renders a ProtocolsTimeline component from /protocolTimeline', () => {
    render(`/protocols/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/timeline`)
    screen.getByText('Mock ProtocolTimeline')
  })

  it('renders a ProtocolRunDetails component from /devices/:robotName/protocol-runs/:runId/:protocolRunDetailsTab', () => {
    render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/setup'
    )
    screen.getByText('Mock ProtocolRunDetails')
  })

  it('should poll for software updates', () => {
    render()
    expect(vi.mocked(useSoftwareUpdatePoll)).toBeCalled()
  })
})
