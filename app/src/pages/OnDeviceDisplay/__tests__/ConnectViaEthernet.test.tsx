import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import * as Networking from '../../../redux/networking'
import { ConnectViaEthernet } from '../ConnectViaEthernet'

const mockPush = jest.fn()

jest.mock('../../../redux/networking')
jest.mock('../../../redux/discovery')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const initialMockEthernet = {
  ipAddress: '127.0.0.101',
  subnetMask: '255.255.255.231',
  macAddress: 'ET:NT:00:00:00:00',
  type: Networking.INTERFACE_ETHERNET,
}

const noNetworkMockEthernet = {
  ipAddress: null,
  subnetMask: null,
  macAddress: 'ET:NT:00:00:00:00',
  type: Networking.INTERFACE_ETHERNET,
}

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ConnectViaEthernet />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConnectViaEthernet', () => {
  beforeEach(() => {
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: null,
      ethernet: initialMockEthernet,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render text and button - connection status: connected', () => {
    const [{ getByText, getByRole }] = render()
    getByRole('button', { name: 'Back' })
    getByText('Connect via Ethernet')
    getByText('Connection status:')
    getByText('Connected')
    getByText('IP Address: 127.0.0.101')
    getByText('Subnet Mask: 255.255.255.231')
    getByText('MAC Address: ET:NT:00:00:00:00')
    getByRole('button', { name: 'Next step' })
  })

  it('should render text and button - connection status: not network found', () => {
    mockGetNetworkInterfaces.mockReturnValue({
      wifi: null,
      ethernet: noNetworkMockEthernet,
    })
    const [{ getByText, getAllByText, getByRole, queryByRole }] = render()
    getByRole('button', { name: 'Back' })
    getByText('Connect via Ethernet')
    getByText('Connection status:')
    expect(getAllByText('No network found').length).toBe(2)
    getByText(
      'Connect an Ethernet cable to the back of the robot to display network connection.'
    )
    getByText('IP Address: No data')
    getByText('Subnet Mask: No data')
    getByText('MAC Address: ET:NT:00:00:00:00')
    const nextStep = queryByRole('button', { name: 'Next step' })
    expect(nextStep).not.toBeInTheDocument()
  })

  it('when clicking back button, call a mock function', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Back' })
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith('/network-setup-menu')
  })

  // ToDo kj: 12/01/2022 activate this case when merge name screen
  // it('when clicking next step button, call a mock function', () => {
  //   const [{ getByRole }] = render()
  //   const button = getByRole('button', { name: 'Next step' })
  //   fireEvent.click(button)
  //   // expect(mockPush).toHaveBeenCalledWith('/name-robot')
  // })
})
