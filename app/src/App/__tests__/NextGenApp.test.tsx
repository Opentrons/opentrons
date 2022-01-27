import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'

import { useRobot } from '../../organisms/Devices/hooks'
import { DeviceDetails } from '../../pages/Devices/DeviceDetails'
import { DevicesLanding } from '../../pages/Devices/DevicesLanding'
import { AppSettings } from '../../pages/More/AppSettings'
import { mockConnectableRobot } from '../../redux/discovery/__fixtures__'
import { NextGenApp } from '../NextGenApp'

jest.mock('../../organisms/Devices/hooks')
jest.mock('../../pages/Devices/DeviceDetails')
jest.mock('../../pages/Devices/DevicesLanding')
jest.mock('../../pages/More/AppSettings')

const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockDeviceDetails = DeviceDetails as jest.MockedFunction<
  typeof DeviceDetails
>
mockDeviceDetails.mockReturnValue(<div>Mock DeviceDetails</div>)
const mockDevicesLanding = DevicesLanding as jest.MockedFunction<
  typeof DevicesLanding
>
mockDevicesLanding.mockReturnValue(<div>Mock DevicesLanding</div>)
const mockAppSettings = AppSettings as jest.MockedFunction<typeof AppSettings>
mockAppSettings.mockReturnValue(<div>Mock AppSettings</div>)

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <NextGenApp />
    </MemoryRouter>
  )
}

describe('NextGenApp', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('renders an AppSettings component', () => {
    const [{ getByText }] = render('/app-settings/feature-flags')
    expect(getByText('Mock AppSettings')).toBeTruthy()
  })

  it('renders a DevicesLanding component from /robots', () => {
    const [{ getByText }] = render('/devices')
    expect(getByText('Mock DevicesLanding')).toBeTruthy()
  })

  it('renders a DeviceDetails component from /robots/:robotName', () => {
    when(mockUseRobot).calledWith('otie').mockReturnValue(mockConnectableRobot)
    const [{ getByText }] = render('/devices/otie')
    expect(getByText('Mock DeviceDetails')).toBeTruthy()
  })

  it('renders an AppSettings component from /more', () => {
    const [{ getByText }] = render('/more')
    expect(getByText('Mock AppSettings')).toBeTruthy()
  })
  it('renders a nav bar with a protocols from /more', () => {
    const [{ getByText }] = render('/more')
    expect(getByText('Mock AppSettings')).toBeTruthy()
  })
})
