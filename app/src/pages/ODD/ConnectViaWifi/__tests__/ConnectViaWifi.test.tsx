import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { INTERFACE_WIFI, mockWifiNetwork } from '@opentrons/api-client'
import { usePostWifiConfigureMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import {
  useNetworkInterfaces,
  useWifiList,
} from '/app/resources/networking/hooks'

import { ConnectViaWifi } from '../'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/discovery')
vi.mock('/app/resources/networking/hooks')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const mockWifiList = [
  { ...mockWifiNetwork, ssid: 'foo', active: true },
  { ...mockWifiNetwork, ssid: 'bar' },
  {
    ...mockWifiNetwork,
    ssid: 'baz',
  },
]

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: INTERFACE_WIFI,
}

const mockPostWifiConfigure = vi.fn()
const mockReset = vi.fn()

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
    mockPostWifiConfigure.mockClear()
    mockReset.mockClear()
    vi.mocked(usePostWifiConfigureMutation).mockReturnValue({
      postWifiConfigure: mockPostWifiConfigure,
      mutate: mockPostWifiConfigure,
      reset: mockReset,
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      status: 'idle',
    } as any)
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
    vi.mocked(useNetworkInterfaces).mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'foo' }))
    screen.getByText('WPA2 Personal')
  })

  it('should render SetWifiCred', () => {
    vi.mocked(useWifiList).mockReturnValue(mockWifiList)
    vi.mocked(useNetworkInterfaces).mockReturnValue({
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
    vi.mocked(useNetworkInterfaces).mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    vi.mocked(usePostWifiConfigureMutation).mockReturnValue({
      postWifiConfigure: mockPostWifiConfigure,
      mutate: mockPostWifiConfigure,
      reset: mockReset,
      isLoading: true,
      isSuccess: false,
      isError: false,
      error: null,
      status: 'loading',
    } as any)
    render()
    fireEvent.click(screen.getByRole('button', { name: 'foo' }))
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.click(screen.getByText('Connect'))
  })
})
