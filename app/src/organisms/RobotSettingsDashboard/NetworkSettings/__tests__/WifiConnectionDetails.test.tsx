import * as React from 'react'
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
      ssid: 'mock wifi ssid',
      authType: 'WPA-2',
      setShowInterfaceTitle: jest.fn(),
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
    const [{ getByText, getByLabelText }] = render(props)
    getByText('Connected Network')
    getByLabelText('mock wifi ssid_wifi_icon')
    getByLabelText('mock wifi ssid_info_icon')
    getByText('mock wifi ssid')
    getByText('View details')
    getByText('Other Networks')
  })

  it('should show the modal when tapping connected wifi button', () => {
    const [{ getByText }] = render(props)
    const button = getByText('mock wifi ssid')
    button.click()
    getByText('mock NetworkDetailsModal')
  })

  it('should not render text and button when not connected to a network', () => {
    props = {
      setShowInterfaceTitle: jest.fn(),
    }
    const [{ queryByText }] = render(props)
    expect(queryByText('Connected Network')).not.toBeInTheDocument()
    expect(queryByText('mock wifi ssid')).not.toBeInTheDocument()
    expect(queryByText('Other Networks')).not.toBeInTheDocument()
  })

  it.todo('should render the wifi list')
})
