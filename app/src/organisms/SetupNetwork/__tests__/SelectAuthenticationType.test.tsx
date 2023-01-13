import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Networking from '../../../redux/networking'
import { SetWifiCred } from '../SetWifiCred'
import { SelectAuthenticationType } from '../SelectAuthenticationType'

const mockPush = jest.fn()
const mockSetIsShowSelectAuthenticationType = jest.fn()
const mockSetIsShowSetWifiCred = jest.fn()
jest.mock('../../../organisms/SetupNetwork/SetWifiCred')
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
const mockSetWifiCred = SetWifiCred as jest.MockedFunction<typeof SetWifiCred>

const render = (
  props: React.ComponentProps<typeof SelectAuthenticationType>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <SelectAuthenticationType {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SelectAuthenticationType', () => {
  let props: React.ComponentProps<typeof SelectAuthenticationType>
  beforeEach(() => {
    props = {
      ssid: 'mockWifi',
      fromWifiList: undefined,
      setIsShowSelectAuthenticationType: mockSetIsShowSelectAuthenticationType,
      setIsShowSetWifiCred: mockSetIsShowSetWifiCred,
    }
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: initialMockWifi,
      ethernet: null,
    })
    mockSetWifiCred.mockReturnValue(<div>Mock SetWifiCred</div>)
  })

  it('should render text and buttons', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Connect to mockWifi')
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
    // ToDo need to update this later
    // const [{ getByRole }] = render(props)
    // const button = getByRole('button', { name: 'Back' })
    // fireEvent.click(button)
  })

  it('when tapping back button, call a mock function - fromWifiList', () => {
    // ToDo need to update this later
    // props.fromWifiList = true
    // const [{ getByRole }] = render(props)
    // const button = getByRole('button', { name: 'Back' })
    // fireEvent.click(button)
  })

  it('when tapping next button, call a mock function - wpa', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Next' })
    fireEvent.click(button)
    expect(mockSetIsShowSelectAuthenticationType).toHaveBeenCalled()
    expect(mockSetIsShowSetWifiCred).toHaveBeenCalled()
  })

  it('when tapping connect via usb button, call a mock function', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Connect via USB' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup/usb')
  })
})
