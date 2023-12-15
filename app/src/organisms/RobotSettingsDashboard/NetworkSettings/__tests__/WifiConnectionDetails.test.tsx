import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { getLocalRobot } from '../../../../redux/discovery'
import * as Networking from '../../../../redux/networking'
import { NetworkDetailsModal } from '../NetworkDetailsModal'
import { WifiConnectionDetails } from '../WifiConnectionDetails'

import type { State } from '../../../../redux/types'

jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/networking')
jest.mock('../NetworkDetailsModal')

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>
const mockNetworkDetailsModal = NetworkDetailsModal as jest.MockedFunction<
  typeof NetworkDetailsModal
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>

const ROBOT_NAME = 'otie'

const initialMockWifi = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'WI:FI:00:00:00:00',
  type: Networking.INTERFACE_WIFI,
}

const render = (props: React.ComponentProps<typeof WifiConnectionDetails>) => {
  return renderWithProviders(<WifiConnectionDetails {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WifiConnectionDetails', () => {
  let props: React.ComponentProps<typeof WifiConnectionDetails>
  beforeEach(() => {
    props = {
      activeSsid: 'mock wifi ssid',
      connectedWifiAuthType: 'none',
      handleNetworkPress: jest.fn(),
      handleJoinAnotherNetwork: jest.fn(),
    }
    mockGetLocalRobot.mockReturnValue({
      name: ROBOT_NAME,
    } as any)
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({
        wifi: initialMockWifi,
        ethernet: null,
      })
    mockNetworkDetailsModal.mockReturnValue(<div>mock NetworkDetailsModal</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.clearAllMocks()
  })

  it('should render text and button with icon when connected to a network', () => {
    render(props)
    screen.getByText('Connected Network')
    screen.getByLabelText('mock wifi ssid_wifi_icon')
    screen.getByLabelText('mock wifi ssid_info_icon')
    screen.getByText('mock wifi ssid')
    screen.getByText('View details')
    screen.getByText('Other Networks')
  })

  it('should show the modal when tapping connected wifi button', () => {
    render(props)
    const button = screen.getByText('mock wifi ssid')
    fireEvent.click(button)
    screen.getByText('mock NetworkDetailsModal')
  })

  it('should not render text and button when not connected to a network', () => {
    props.activeSsid = undefined
    render(props)
    expect(screen.queryByText('Connected Network')).not.toBeInTheDocument()
    expect(screen.queryByText('mock wifi ssid')).not.toBeInTheDocument()
    expect(screen.queryByText('Other Networks')).not.toBeInTheDocument()
  })

  it.todo('should render the wifi list')
})
