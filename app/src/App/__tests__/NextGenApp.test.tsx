import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { resetAllWhenMocks, when } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { Breadcrumbs } from '../../molecules/Breadcrumbs'
import { DeviceDetails } from '../../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../../pages/Devices/DevicesLanding'
import { ProtocolRunDetails } from '../../pages/Devices/ProtocolRunDetails'
import { RobotSettings } from '../../pages/Devices/RobotSettings'
import { GeneralSettings } from '../../organisms/AppSettings/GeneralSettings'
import { usePathCrumbs } from '../hooks'
import { NextGenApp } from '../NextGenApp'

jest.mock('../../molecules/Breadcrumbs')
jest.mock('../../organisms/Devices/hooks')
jest.mock('../../pages/Devices/DeviceDetails')
jest.mock('../../pages/Devices/DevicesLanding')
jest.mock('../../pages/Devices/ProtocolRunDetails')
jest.mock('../../pages/Devices/RobotSettings')
jest.mock('../../organisms/Labware/helpers/getAllDefs')
jest.mock('../../organisms/AppSettings/GeneralSettings')
jest.mock('../../redux/config')
jest.mock('../hooks')

const mockDeviceDetails = DeviceDetails as jest.MockedFunction<
  typeof DeviceDetails
>
mockDeviceDetails.mockReturnValue(<div>Mock DeviceDetails</div>)
const mockDevicesLanding = DevicesLanding as jest.MockedFunction<
  typeof DevicesLanding
>
mockDevicesLanding.mockReturnValue(<div>Mock DevicesLanding</div>)
const mockProtocolRunDetails = ProtocolRunDetails as jest.MockedFunction<
  typeof ProtocolRunDetails
>
mockProtocolRunDetails.mockReturnValue(<div>Mock ProtocolRunDetails</div>)
const mockRobotSettings = RobotSettings as jest.MockedFunction<
  typeof RobotSettings
>
mockRobotSettings.mockReturnValue(<div>Mock RobotSettings</div>)
const mockAppSettings = GeneralSettings as jest.MockedFunction<
  typeof GeneralSettings
>
mockAppSettings.mockReturnValue(<div>Mock AppSettings</div>)
const mockBreadcrumbs = Breadcrumbs as jest.MockedFunction<typeof Breadcrumbs>
mockBreadcrumbs.mockReturnValue(<div>Mock Breadcrumbs</div>)
const mockUsePathCrumbs = usePathCrumbs as jest.MockedFunction<
  typeof usePathCrumbs
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <NextGenApp />
    </MemoryRouter>
  )
}

describe('NextGenApp', () => {
  beforeEach(() => {
    when(mockUsePathCrumbs).calledWith().mockReturnValue([])
  })
  afterEach(() => {
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

  it('renders a DevicesLanding component from /robots', () => {
    const [{ getByText }] = render('/devices')
    getByText('Mock DevicesLanding')
  })

  it('renders a DeviceDetails component from /robots/:robotName', () => {
    const [{ getByText }] = render('/devices/otie')
    getByText('Mock DeviceDetails')
  })

  it('renders a RobotSettings component from /robots/:robotName/robot-settings/:robotSettingsTab', () => {
    const [{ getByText }] = render('/devices/otie/robot-settings/calibration')
    getByText('Mock RobotSettings')
  })

  it('renders a ProtocolRunDetails component from /robots/:robotName/protocol-runs/:runId/:protocolRunDetailsTab', () => {
    const [{ getByText }] = render(
      '/devices/otie/protocol-runs/95e67900-bc9f-4fbf-92c6-cc4d7226a51b/setup'
    )
    getByText('Mock ProtocolRunDetails')
  })
})
