import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../i18n'
import { Breadcrumbs } from '../../organisms/Breadcrumbs'
import { DeviceDetails } from '../../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../../pages/Devices/DevicesLanding'
import { ProtocolsLanding } from '../../pages/Protocols/ProtocolsLanding'
import { ProtocolRunDetails } from '../../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../../pages/Devices/RobotSettings'
import { GeneralSettings } from '../../pages/AppSettings/GeneralSettings'
import { getIsOnDevice } from '../../redux/config'
import { getLocalRobot } from '../../redux/discovery'
import { Alerts } from '../../organisms/Alerts'
import { App } from '../'

jest.mock('../../organisms/Breadcrumbs')
jest.mock('../../organisms/Devices/hooks')
jest.mock('../../pages/Devices/DeviceDetails')
jest.mock('../../pages/Devices/DevicesLanding')
jest.mock('../../pages/Protocols/ProtocolsLanding')
jest.mock('../../pages/Devices/ProtocolRunDetails')
jest.mock('../../pages/Devices/RobotSettings')
jest.mock('../../organisms/Alerts')
jest.mock('../../pages/Labware/helpers/getAllDefs')
jest.mock('../../pages/AppSettings/GeneralSettings')
jest.mock('../../redux/config')
jest.mock('../../redux/discovery')
jest.mock('../hooks')

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

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <App />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('App', () => {
  beforeEach(() => {
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
  })
  afterEach(() => {
    jest.resetAllMocks()
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
    mockGetIsOnDevice.mockReturnValue(true)
    const [{ queryByText }] = render('/devices')
    expect(queryByText('Mock DevicesLanding')).toBeNull()
  })

  it('renders a DeviceDetails component from /robots/:robotName', () => {
    const [{ getByText }] = render('/devices/otie')
    getByText('Mock DeviceDetails')
  })

  it('renders a RobotSettings component from /robots/:robotName/robot-settings/:robotSettingsTab', () => {
    const [{ getByText }] = render('/devices/otie/robot-settings/calibration')
    getByText('Mock RobotSettings')
  })

  it('renders a ProtocolsLanding component from /protocols', () => {
    const [{ getByText }] = render('/protocols')
    getByText('Mock ProtocolsLanding')
  })

  it('renders a ProtocolRunDetails component from /robots/:robotName/protocol-runs/:runId/:protocolRunDetailsTab', () => {
    const [{ getByText }] = render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/setup'
    )
    getByText('Mock ProtocolRunDetails')
  })

  it('should render app-wide Alerts', () => {
    const [{ getByText }] = render()
    getByText('Mock Alerts')
  })
})
