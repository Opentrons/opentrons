import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import * as RobotApi from '../../../redux/robot-api'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { useWifiList } from '../../../resources/networking/hooks'
import * as Networking from '../../../redux/networking'
import { ConnectViaWifi } from '../ConnectViaWifi'

jest.mock('../../../redux/discovery')
jest.mock('../../../resources/networking/hooks')
jest.mock('../../../redux/networking/selectors')
jest.mock('../../../redux/robot-api/selectors')

const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  {
    ...Fixtures.mockWifiNetwork,
    ssid: 'baz',
  },
]

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: Networking.INTERFACE_WIFI,
}

const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
const mockUseWifiList = useWifiList as jest.MockedFunction<typeof useWifiList>
const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>

// ToDo (kj:05/16/2023) this test will be updated later
// since this test requires to update the entire wifi setup flow

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectViaWifi />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConnectViaWifi', () => {
  beforeEach(() => {
    mockGetRequestById.mockReturnValue(null)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render step meter 2/5 (width:40%)', () => {
    const [{ getByTestId }] = render()
    getByTestId('StepMeter_StepMeterContainer')
    const bar = getByTestId('StepMeter_StepMeterBar')
    expect(bar).toHaveStyle('width: 40%')
  })

  it('should render Searching for networks', () => {
    const [{ getByText }] = render()
    getByText('Searching for networks...')
  })

  it('should render DisplayWifiList', () => {
    mockUseWifiList.mockReturnValue(mockWifiList)
    const [{ getByText }] = render()
    getByText('foo')
    getByText('bar')
    getByText('baz')
  })

  it('should render SelectAuthenticationType', () => {
    mockUseWifiList.mockReturnValue(mockWifiList)
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    const [{ getByRole, getByText }] = render()
    getByRole('button', { name: 'foo' }).click()
    getByText('WPA2 Personal')
  })

  it('should render SetWifiCred', () => {
    mockUseWifiList.mockReturnValue(mockWifiList)
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    const [{ getByRole, getByText }] = render()
    getByRole('button', { name: 'foo' }).click()
    getByText('Continue').click()
    getByText('Enter password')
  })

  it('should render ConnectingNetwork', () => {
    mockUseWifiList.mockReturnValue(mockWifiList)
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    mockGetRequestById.mockReturnValue({
      status: RobotApi.PENDING,
    })
    const [{ getByRole, getByText }] = render()
    getByRole('button', { name: 'foo' }).click()
    getByText('Continue').click()
    getByText('Connect').click()
  })

  /* 
  ToDO (kj:05/25/2023) fix these later
  it('should render WifiConnectionDetails', () => {
    mockUseWifiList.mockReturnValue(mockWifiList)
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    mockGetRequestById.mockReturnValue({
      status: RobotApi.SUCCESS,
      response: {} as any,
    })
    const [{ getByRole, getByText }] = render()
    getByRole('button', { name: 'foo' }).click()
    getByText('Continue').click()
    getByText('Connect').click()
    getByText('Successfully connected to foo!')
  })

  it('should render FailedToConnect', () => {
    mockUseWifiList.mockReturnValue(mockWifiList)
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    mockGetRequestById.mockReturnValue({
      status: RobotApi.FAILURE,
      response: {} as any,
      error: { message: 'mock error' },
    })
    const [{ getByRole, getByText }] = render()
    getByRole('button', { name: 'foo' }).click()
    getByText('Continue').click()
    getByText('Connect').click()
    getByText('Oops! Incorrect password for foo')
  })
  */
})
