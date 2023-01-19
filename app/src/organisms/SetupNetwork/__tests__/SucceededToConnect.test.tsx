import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Networking from '../../../redux/networking'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { SucceededToConnect } from '../SucceededToConnect'

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>

const mockGetWifiList = Networking.getWifiList as jest.MockedFunction<
  typeof Networking.getWifiList
>
const mockPush = jest.fn()

jest.mock('../../../redux/networking')
jest.mock('../../../redux/discovery/selectors')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof SucceededToConnect>) => {
  return renderWithProviders(
    <MemoryRouter>
      <SucceededToConnect {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: Networking.INTERFACE_WIFI,
}

const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar', active: false },
]

describe('SucceededToConnect', () => {
  let props: React.ComponentProps<typeof SucceededToConnect>
  beforeEach(() => {
    props = {
      ssid: 'mockWifi',
      authType: 'wpa-psk',
    }
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    mockGetWifiList.mockReturnValue(mockWifiList)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title and description', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Connect via Wi-Fi')
    getByText('Connection status:')
    getByText('Connected')
    getByText('mockWifi')
    getByText('IP Address: 127.0.0.100')
    getByText('Subnet Mask: 255.255.255.230')
    getByText('MAC Address: WI:FI:00:00:00:00')
    getByRole('button', { name: 'Check for updates' })
  })

  it('when clicking Check for updates button, should call mock function', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Check for updates' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/robot-settings/update-robot')
  })
})
