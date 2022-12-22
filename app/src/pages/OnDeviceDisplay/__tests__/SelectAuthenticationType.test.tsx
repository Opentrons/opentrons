import * as React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Networking from '../../../redux/networking'
import { SelectAuthenticationType } from '../SelectAuthenticationType'

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

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: Networking.INTERFACE_WIFI,
}

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/network-setup/wifi/select-auth-type/:ssid">
        <SelectAuthenticationType />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SelectAuthenticationType', () => {
  beforeEach(() => {
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
  })

  it('should render text and buttons', () => {
    const [{ getByText, getByRole }] = render(
      '/network-setup/wifi/select-auth-type/mockWiFi'
    )
    getByText('Connect to mockWiFi')
    getByRole('button', { name: 'Back' })
    getByRole('button', { name: 'Next' })
    getByText('Select authentication method for your selected network.')
    getByRole('button', { name: 'WPA2 Personal' })
    getByRole('button', { name: 'None' })
    getByText('MAC Address:')
    getByText('WI:FI:00:00:00:00')
    getByText(
      'If your network uses a different authentication method, connect to the Opentrons App and finish Wi-Fi setup there.'
    )
    getByRole('button', { name: 'Connect via USB' })
  })

  it('when tapping back button, call a mock function', () => {
    const [{ getByRole }] = render(
      '/network-setup/wifi/select-auth-type/mockWiFi'
    )
    const button = getByRole('button', { name: 'Back' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/wifi')
  })

  it('when tapping next button, call a mock function - wpa', () => {
    const [{ getByRole }] = render(
      '/network-setup/wifi/select-auth-type/mockWiFi'
    )
    const button = getByRole('button', { name: 'Next' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith(
      '/network-setup/wifi/set-wifi-cred/mockWiFi/wpa'
    )
  })

  it('when tapping next button, call a mock function - none', () => {
    const [{ getByRole }] = render(
      '/network-setup/wifi/select-auth-type/mockWiFi'
    )
    const authButton = getByRole('button', { name: 'None' })
    fireEvent.click(authButton)
    const button = getByRole('button', { name: 'Next' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith(
      '/network-setup/wifi/set-wifi-cred/mockWiFi/none'
    )
  })

  it('when tapping connect via usb button, call a mock function', () => {
    const [{ getByRole }] = render(
      '/network-setup/wifi/select-auth-type/mockWiFi'
    )
    const button = getByRole('button', { name: 'Connect via USB' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/usb')
  })
})
