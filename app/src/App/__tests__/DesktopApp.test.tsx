import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { LocalizationProvider } from '/app/LocalizationProvider'
import { Breadcrumbs } from '/app/organisms/Desktop/Breadcrumbs'
import { SystemLanguagePreferenceModal } from '/app/organisms/Desktop/SystemLanguagePreferenceModal'
import { EstopTakeover } from '/app/organisms/EmergencyStop'
import { IncompatibleModuleTakeover } from '/app/organisms/IncompatibleModule'
import { GeneralSettings } from '/app/pages/Desktop/AppSettings/GeneralSettings'
import { CalibrationDashboard } from '/app/pages/Desktop/Devices/CalibrationDashboard'
import { DeviceDetails } from '/app/pages/Desktop/Devices/DeviceDetails'
import { DevicesLanding } from '/app/pages/Desktop/Devices/DevicesLanding'
import { ProtocolRunDetails } from '/app/pages/Desktop/Devices/ProtocolRunDetails'
import { RobotSettings } from '/app/pages/Desktop/Devices/RobotSettings'
import { ProtocolsLanding } from '/app/pages/Desktop/Protocols/ProtocolsLanding'

// TODO(jh, 04-23-25): Prettier import order affects testing. Investigate further.
// prettier-ignore
import { AlertsModal } from '/app/organisms/Desktop/Alerts/AlertsModal'

import { ProtocolVisualization } from '/app/pages/Desktop/Protocols/ProtocolVisualization'
import { useIsFlex, useRobot } from '/app/redux-resources/robots'

import { DesktopApp } from '../DesktopApp'
import { useSoftwareUpdatePoll } from '../hooks/useSoftwareUpdatePoll'

import type { LocalizationProviderProps } from '/app/LocalizationProvider'
import type { State } from '/app/redux/types'

vi.mock('/app/LocalizationProvider')
vi.mock('/app/organisms/Desktop/Breadcrumbs')
vi.mock('/app/organisms/Desktop/SystemLanguagePreferenceModal')
vi.mock('/app/pages/Desktop/AppSettings/GeneralSettings')
vi.mock('/app/pages/Desktop/Devices/CalibrationDashboard')
vi.mock('/app/pages/Desktop/Devices/DeviceDetails')
vi.mock('/app/pages/Desktop/Devices/DevicesLanding')
vi.mock('/app/pages/Desktop/Protocols/ProtocolsLanding')
vi.mock('/app/pages/Desktop/Devices/ProtocolRunDetails')
vi.mock('/app/pages/Desktop/Devices/RobotSettings')
vi.mock('/app/organisms/Desktop/Alerts/AlertsModal')
vi.mock('/app/organisms/EmergencyStop')
vi.mock('/app/organisms/IncompatibleModule')
vi.mock('/app/redux/config')
vi.mock('/app/redux-resources/robots')
vi.mock('../hooks/useSoftwareUpdatePoll')
vi.mock('/app/pages/Desktop/Protocols/ProtocolVisualization')
vi.mock('/app/resources/devices/hooks/useTrackRobotRestarts', () => ({
  useTrackRobotRestarts: vi.fn(),
}))
vi.mock('/app/resources/robot-update/RobotUpdateProvider', () => ({
  RobotUpdateProvider: ({ children }: { children: JSX.Element }) => children,
}))

const render = (path = '/') => {
  return renderWithProviders<State>(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <DesktopApp />
    </MemoryRouter>,
    {
      initialState: {
        robotAuth: { mostRecentRobotName: null, perRobotAuthStates: {} },
      } satisfies Partial<State> as State,
      i18nInstance: i18n,
    }
  )
}

describe('DesktopApp', () => {
  beforeEach(() => {
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
    vi.mocked(ProtocolVisualization).mockReturnValue(
      <div>Mock Visualization</div>
    )
    vi.mocked(RobotSettings).mockReturnValue(<div>Mock RobotSettings</div>)
    vi.mocked(GeneralSettings).mockReturnValue(<div>Mock AppSettings</div>)
    vi.mocked(Breadcrumbs).mockReturnValue(<div>Mock Breadcrumbs</div>)
    vi.mocked(SystemLanguagePreferenceModal).mockReturnValue(
      <div>Mock SystemLanguagePreferenceModal</div>
    )
    vi.mocked(AlertsModal).mockReturnValue(<></>)
    vi.mocked(EstopTakeover).mockReturnValue(<></>)
    vi.mocked(IncompatibleModuleTakeover).mockReturnValue(<></>)
    vi.mocked(useIsFlex).mockReturnValue(true)
    vi.mocked(useRobot).mockReturnValue({
      name: 'otie',
      ip: '127.0.0.1',
      port: 31950,
    } as any)
    vi.mocked(LocalizationProvider).mockImplementation(
      (props: LocalizationProviderProps) => <>{props.children}</>
    )
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('renders a Breadcrumbs component', () => {
    render('/devices')
    screen.getByText('Mock Breadcrumbs')
  })

  it('renders a SystemLanguagePreferenceModal component', () => {
    render('/protocols')
    screen.getByText('Mock SystemLanguagePreferenceModal')
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

  it('renders a ProtocolsTimeline component from /visualization', () => {
    render(`/protocols/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/visualization`)
    screen.getByText('Mock Visualization')
  })

  it('renders a ProtocolsTimeline component from /visualization', () => {
    render(
      `/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/mockDecodedTimestamp/6b94f0a9-e91e-4202-b25f-ab13beab4bca/visualization`
    )
    screen.getByText('Mock Visualization')
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
