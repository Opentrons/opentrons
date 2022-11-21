import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../i18n'
import { Breadcrumbs } from '../../organisms/Breadcrumbs'
import { CalibrationDashboard } from '../../pages/Devices/CalibrationDashboard'
import { DeviceDetails } from '../../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../../pages/Devices/DevicesLanding'
import { ProtocolsLanding } from '../../pages/Protocols/ProtocolsLanding'
import { ProtocolRunDetails } from '../../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../../pages/Devices/RobotSettings'
import { GeneralSettings } from '../../pages/AppSettings/GeneralSettings'
import { InitialSplash } from '../../pages/OnDeviceDisplay/InitialSplash'
import { SelectWifiNetwork } from '../../pages/OnDeviceDisplay/SelectWifiNetwork'
import { SetWifiCred } from '../../pages/OnDeviceDisplay/SetWifiCred'
import { ConnectedNetworkInfo } from '../../pages/OnDeviceDisplay/ConnectedNetworkInfo'
import { getIsOnDevice } from '../../redux/config'
import { getLocalRobot } from '../../redux/discovery'
import { Alerts } from '../../organisms/Alerts'
import { App } from '../'

import type { State } from '../../redux/types'

jest.mock('../../organisms/Breadcrumbs')
jest.mock('../../organisms/Devices/hooks')
jest.mock('../../pages/Devices/CalibrationDashboard')
jest.mock('../../pages/Devices/DeviceDetails')
jest.mock('../../pages/Devices/DevicesLanding')
jest.mock('../../pages/Protocols/ProtocolsLanding')
jest.mock('../../pages/Devices/ProtocolRunDetails')
jest.mock('../../pages/Devices/RobotSettings')
jest.mock('../../pages/OnDeviceDisplay/InitialSplash')
jest.mock('../../pages/OnDeviceDisplay/SelectNetwork')
jest.mock('../../pages/OnDeviceDisplay/SetWifiCred')
jest.mock('../../pages/OnDeviceDisplay/ConnectedNetworkInfo')
jest.mock('../../organisms/Alerts')
jest.mock('../../pages/Labware/helpers/getAllDefs')
jest.mock('../../pages/AppSettings/GeneralSettings')
jest.mock('../../redux/config')
jest.mock('../../redux/discovery')
jest.mock('../hooks')

const MOCK_STATE: State = {
  config: {
    isOnDevice: true,
  },
} as any

const mockCalibrationDashboard = CalibrationDashboard as jest.MockedFunction<
  typeof CalibrationDashboard
>
const mockDeviceDetails = DeviceDetails as jest.MockedFunction<
  typeof DeviceDetails
>
const mockDevicesLanding = DevicesLanding as jest.MockedFunction<
  typeof DevicesLanding
>
const mockProtocolsLanding = ProtocolsLanding as jest.MockedFunction<
  typeof ProtocolsLanding
>
const mockProtocolRunDetails = ProtocolRunDetails as jest.MockedFunction<
  typeof ProtocolRunDetails
>
const mockRobotSettings = RobotSettings as jest.MockedFunction<
  typeof RobotSettings
>
const mockAlerts = Alerts as jest.MockedFunction<typeof Alerts>
const mockAppSettings = GeneralSettings as jest.MockedFunction<
  typeof GeneralSettings
>
const mockBreadcrumbs = Breadcrumbs as jest.MockedFunction<typeof Breadcrumbs>
const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>

const mockInitialSplash = InitialSplash as jest.MockedFunction<
  typeof InitialSplash
>

const mockSelectWifiNetwork = SelectWifiNetwork as jest.MockedFunction<
  typeof SelectWifiNetwork
>

const mockSetWifiCred = SetWifiCred as jest.MockedFunction<typeof SetWifiCred>

const mockConnectedNetworkInfo = ConnectedNetworkInfo as jest.MockedFunction<
  typeof ConnectedNetworkInfo
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <App />
    </MemoryRouter>,
    { i18nInstance: i18n, initialState: MOCK_STATE }
  )
}

describe('App', () => {
  beforeEach(() => {
    mockCalibrationDashboard.mockReturnValue(
      <div>Mock CalibrationDashboard</div>
    )
    mockDeviceDetails.mockReturnValue(<div>Mock DeviceDetails</div>)
    mockDevicesLanding.mockReturnValue(<div>Mock DevicesLanding</div>)
    mockProtocolsLanding.mockReturnValue(<div>Mock ProtocolsLanding</div>)
    mockProtocolRunDetails.mockReturnValue(<div>Mock ProtocolRunDetails</div>)
    mockRobotSettings.mockReturnValue(<div>Mock RobotSettings</div>)
    mockAlerts.mockReturnValue(<div>Mock Alerts</div>)
    mockAppSettings.mockReturnValue(<div>Mock AppSettings</div>)
    mockBreadcrumbs.mockReturnValue(<div>Mock Breadcrumbs</div>)
    mockGetIsOnDevice.mockReturnValue(false)
    mockGetLocalRobot.mockReturnValue(null)
    mockInitialSplash.mockReturnValue(<div>Mock InitialSplash</div>)
    mockSelectWifiNetwork.mockReturnValue(<div>Mock SelectWifiNetwork</div>)
    mockSetWifiCred.mockReturnValue(<div>Mock SetWifiCred</div>)
    mockConnectedNetworkInfo.mockReturnValue(
      <div>Mock ConnectedNetworkInfo</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })
  it('renders a Breadcrumbs component', () => {
    const [{ getByText }] = render('/devices')
    getByText('Mock Breadcrumbs')
  })

  it('renders an AppSettings component', () => {
    const [{ getByText }] = render('/app-settings/general')
    getByText('Mock AppSettings')
  })

  it('renders a DevicesLanding component from /devices', () => {
    const [{ getByText }] = render('/devices')
    getByText('Mock DevicesLanding')
  })

  it('does not render a DevicesLanding component from /devices in single device mode', () => {
    when(mockGetIsOnDevice).calledWith(MOCK_STATE).mockReturnValue(true)
    const [{ queryByText }] = render('/devices')
    expect(queryByText('Mock DevicesLanding')).toBeNull()
  })

  it('renders a DeviceDetails component from /devices/:robotName', () => {
    const [{ getByText }] = render('/devices/otie')
    getByText('Mock DeviceDetails')
  })

  it('renders a RobotSettings component from /devices/:robotName/robot-settings/:robotSettingsTab', () => {
    const [{ getByText }] = render('/devices/otie/robot-settings/calibration')
    getByText('Mock RobotSettings')
  })

  it('renders a CalibrationDashboard component from /devices/:robotName/robot-settings/calibration/dashboard', () => {
    const [{ getByText }] = render(
      '/devices/otie/robot-settings/calibration/dashboard'
    )
    getByText('Mock CalibrationDashboard')
  })

  it('renders a ProtocolsLanding component from /protocols', () => {
    const [{ getByText }] = render('/protocols')
    getByText('Mock ProtocolsLanding')
  })

  it('renders a ProtocolRunDetails component from /devices/:robotName/protocol-runs/:runId/:protocolRunDetailsTab', () => {
    const [{ getByText }] = render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/setup'
    )
    getByText('Mock ProtocolRunDetails')
  })

  it('should render app-wide Alerts', () => {
    const [{ getByText }] = render()
    getByText('Mock Alerts')
  })

  it('renders a InitialSplash component component from /device-setup', () => {
    when(mockGetIsOnDevice).calledWith(MOCK_STATE).mockReturnValue(true)
    const [{ getByText }] = render('/device-setup')
    getByText('Mock InitialSplash')
  })

  it('renders a SelectNetwork component from /connect-via-wifi', () => {
    when(mockGetIsOnDevice).calledWith(MOCK_STATE).mockReturnValue(true)
    const [{ getByText }] = render('/connect-via-wifi')
    getByText('Mock SelectWifiNetwork')
  })

  it('renders a SetWifiCred component from /set-wifi-cred/:ssid', () => {
    when(mockGetIsOnDevice).calledWith(MOCK_STATE).mockReturnValue(true)
    const [{ getByText }] = render('/set-wifi-cred/mockWifi')
    getByText('Mock SetWifiCred')
  })

  it('renders a ConnectedNetworkInfo component from /connected-network-info/:ssid', () => {
    when(mockGetIsOnDevice).calledWith(MOCK_STATE).mockReturnValue(true)
    const [{ getByText }] = render('/connected-network-info/mockWifi')
    getByText('Mock ConnectedNetworkInfo')
  })
})
