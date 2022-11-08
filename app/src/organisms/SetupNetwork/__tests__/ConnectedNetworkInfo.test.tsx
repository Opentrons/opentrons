import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Networking from '../../../redux/networking'
import * as Fixtures from '../../../redux/networking/__fixtures__'
import { ConnectedNetworkInfo } from '../ConnectedNetworkInfo'

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

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectedNetworkInfo />
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

const initialMockEthernet = {
  ipAddress: '127.0.0.101',
  subnetMask: '255.255.255.231',
  macAddress: 'US:B0:00:00:00:00',
  type: Networking.INTERFACE_ETHERNET,
}

const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar', active: false },
]

describe('ConnectedNetworkInfo', () => {
  beforeEach(() => {
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: initialMockEthernet,
    })
    mockGetWifiList.mockReturnValue(mockWifiList)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title and description', () => {
    const [{ getByText }] = render()
    getByText('Set up your robot')
    getByText('IP Address: 127.0.0.100')
    getByText('Subnet Mask: 255.255.255.230')
    getByText('Mac Address: WI:FI:00:00:00:00')
    getByText('Change network')
  })

  it('when clicking Change network button, should call mock function', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Change network' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/selectNetwork')
  })
})
