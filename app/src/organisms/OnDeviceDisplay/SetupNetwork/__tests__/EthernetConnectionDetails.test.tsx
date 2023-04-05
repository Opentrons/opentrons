import * as React from 'react'
import { when } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import * as Networking from '../../../../redux/networking'
import { getLocalRobot } from '../../../../redux/discovery'
import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import { EthernetConnectionDetails } from '../EthernetConnectionDetails'

import type { State } from '../../../../redux/types'

jest.mock('../../../../redux/networking')
jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/discovery/selectors')

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>

const ROBOT_NAME = 'opentrons-robot-name'

const render = () => {
  return renderWithProviders(<EthernetConnectionDetails />, {
    i18nInstance: i18n,
  })
}

const mockEthernet = {
  ipAddress: '127.0.0.100',
  subnetMask: '255.255.255.230',
  macAddress: 'ET:NT:00:00:00:00',
  type: Networking.INTERFACE_ETHERNET,
}

describe('EthernetConnectionDetails', () => {
  beforeEach(() => {
    mockGetLocalRobot.mockReturnValue(mockConnectedRobot)
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({
        wifi: null,
        ethernet: mockEthernet,
      })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render ip address, subnet mask, mac address, text and button when ethernet is connected', () => {
    const [{ getByText, queryByText }] = render()
    getByText('IP Address')
    getByText('Subnet Mask')
    getByText('MAC Address')
    getByText('127.0.0.100')
    getByText('255.255.255.230')
    getByText('ET:NT:00:00:00:00')
    expect(
      queryByText(
        'Connect an Ethernet cable to the back of the robot and a network switch or hub.'
      )
    ).not.toBeInTheDocument()
  })

  it('should render mac address no data when ethernet is not connected', () => {
    const notConnectedMockEthernet = {
      ipAddress: null,
      subnetMask: null,
      macAddress: 'ET:NT:00:00:00:11',
      type: Networking.INTERFACE_ETHERNET,
    }
    when(mockGetNetworkInterfaces)
      .calledWith({} as State, ROBOT_NAME)
      .mockReturnValue({
        wifi: null,
        ethernet: notConnectedMockEthernet,
      })
    const [{ getByText, getAllByText }] = render()
    getByText('IP Address')
    getByText('Subnet Mask')
    getByText('MAC Address')
    expect(getAllByText('No data').length).toBe(2)
    getByText('ET:NT:00:00:00:11')
    getByText(
      'Connect an Ethernet cable to the back of the robot and a network switch or hub.'
    )
  })
})
