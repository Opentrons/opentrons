import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

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

// Note: kj 1/19/2023 most cases just check one part from each screen since for this test,
// what we need to check is to render each component with a specific condition.
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
    fireEvent.click(getByRole('button', { name: 'foo' }))
    getByText('WPA2 Personal')
  })

  it('should render SetWifiCred', () => {
    mockUseWifiList.mockReturnValue(mockWifiList)
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    const [{ getByRole, getByText }] = render()
    fireEvent.click(getByRole('button', { name: 'foo' }))
    fireEvent.click(getByRole('button', { name: 'Next' }))
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
    fireEvent.click(getByRole('button', { name: 'foo' }))
    fireEvent.click(getByRole('button', { name: 'Next' }))
    fireEvent.click(getByRole('button', { name: 'Connect' }))
    getByText('Connecting...')
  })

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
    fireEvent.click(getByRole('button', { name: 'foo' }))
    fireEvent.click(getByRole('button', { name: 'Next' }))
    fireEvent.click(getByRole('button', { name: 'Connect' }))
    getByText('Connected')
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
    fireEvent.click(getByRole('button', { name: 'foo' }))
    fireEvent.click(getByRole('button', { name: 'Next' }))
    fireEvent.click(getByRole('button', { name: 'Connect' }))
    getByText('Oops! Incorrect password for foo.')
  })
})
