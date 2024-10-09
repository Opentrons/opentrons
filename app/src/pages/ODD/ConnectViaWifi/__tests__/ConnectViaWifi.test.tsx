import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import * as RobotApi from '/app/redux/robot-api'
import * as Fixtures from '/app/redux/networking/__fixtures__'
import { useWifiList } from '/app/resources/networking/hooks'
import * as Networking from '/app/redux/networking'
import { ConnectViaWifi } from '../'

vi.mock('/app/redux/discovery')
vi.mock('/app/resources/networking/hooks')
vi.mock('/app/redux/networking/selectors')
vi.mock('/app/redux/robot-api/selectors')

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

// const mockGetRequestById = RobotApi.getRequestById as vi.MockedFunction<
//   typeof RobotApi.getRequestById
// >
// const vi.mocked(useWifiList) = useWifiList as vi.MockedFunction<typeof useWifiList>
// const vi.mocked(Networking.etNetworkInterfaces) = Networking.Networking.etNetworkInterfaces as vi.MockedFunction<
//   typeof Networking.Networking.etNetworkInterfaces
// >

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
    vi.mocked(RobotApi.getRequestById).mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render step meter 2/5 (width:40%)', () => {
    render()
    screen.getByTestId('StepMeter_StepMeterContainer')
    const bar = screen.getByTestId('StepMeter_StepMeterBar')
    expect(bar).toHaveStyle('width: 33.33333333333333%')
  })

  it('should render Searching for networks', () => {
    render()
    screen.getByText('Searching for networks...')
  })

  it('should render DisplayWifiList', () => {
    vi.mocked(useWifiList).mockReturnValue(mockWifiList)
    render()
    screen.getByText('foo')
    screen.getByText('bar')
    screen.getByText('baz')
  })

  it('should render SelectAuthenticationType', () => {
    vi.mocked(useWifiList).mockReturnValue(mockWifiList)
    vi.mocked(Networking.getNetworkInterfaces).mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'foo' }))
    screen.getByText('WPA2 Personal')
  })

  it('should render SetWifiCred', () => {
    vi.mocked(useWifiList).mockReturnValue(mockWifiList)
    vi.mocked(Networking.getNetworkInterfaces).mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'foo' }))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Enter password')
  })

  it('should render ConnectingNetwork', () => {
    vi.mocked(useWifiList).mockReturnValue(mockWifiList)
    vi.mocked(Networking.getNetworkInterfaces).mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    vi.mocked(RobotApi.getRequestById).mockReturnValue({
      status: RobotApi.PENDING,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'foo' }))
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.click(screen.getByText('Connect'))
  })

  /* 
  ToDO (kj:05/25/2023) fix these later
  it('should render WifiConnectionDetails', () => {
    vi.mocked(useWifiList).mockReturnValue(mockWifiList)
    vi.mocked(Networking.etNetworkInterfaces).mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    mockGetRequestById.mockReturnValue({
      status: RobotApi.SUCCESS,
      response: {} as any,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'foo' }))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Connect').click()
    screen.getByText('Successfully connected to foo!')
  })

  it('should render FailedToConnect', () => {
    vi.mocked(useWifiList).mockReturnValue(mockWifiList)
    vi.mocked(Networking.etNetworkInterfaces).mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    mockGetRequestById.mockReturnValue({
      status: RobotApi.FAILURE,
      response: {} as any,
      error: { message: 'mock error' },
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'foo' }))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Connect').click()
    screen.getByText('Oops! Incorrect password for foo')
  })
  */
})
