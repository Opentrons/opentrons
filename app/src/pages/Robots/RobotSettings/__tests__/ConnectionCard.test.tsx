import * as React from 'react'
import { mountWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'

import * as Networking from '../../../../redux/networking'
import { CONNECTABLE } from '../../../../redux/discovery'
import { ConnectionCard } from '../ConnectionCard'
import { SelectNetwork } from '../SelectNetwork'
import { ConnectionStatusMessage } from '../connection'

import type { ViewableRobot } from '../../../../redux/discovery/types'

jest.mock('../../../../redux/networking/selectors')
jest.mock('../SelectNetwork', () => ({
  SelectNetwork: () => {
    return <></>
  },
}))

const mockRobot: ViewableRobot = {
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
  ip: '1.2.3.4',
} as any

const mockGetInternetStatus = Networking.getInternetStatus as jest.MockedFunction<
  typeof Networking.getInternetStatus
>

const mockGetNetworkInterfaces = Networking.getNetworkInterfaces as jest.MockedFunction<
  typeof Networking.getNetworkInterfaces
>

describe('ConnectionCard', () => {
  let render: (robot?: ViewableRobot) => ReturnType<typeof mountWithProviders>

  beforeEach(() => {
    jest.useFakeTimers()

    mockGetInternetStatus.mockReturnValue(null)
    mockGetNetworkInterfaces.mockReturnValue({ wifi: null, ethernet: null })

    render = (robot: ViewableRobot = mockRobot) => {
      return mountWithProviders(<ConnectionCard robot={robot} />, {
        i18n,
      })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('calls fetchStatus on mount', () => {
    const expected = Networking.fetchStatus(mockRobot.name)
    const { store } = render()
    expect(store.dispatch).toHaveBeenCalledWith(expected)
  })

  it('calls fetchStatus on an interval', () => {
    const expected = Networking.fetchStatus(mockRobot.name)

    const { store } = render()
    jest.advanceTimersByTime(10000)
    expect(store.dispatch).toHaveBeenNthCalledWith(1, expected)
    expect(store.dispatch).toHaveBeenNthCalledWith(2, expected)
    expect(store.dispatch).toHaveBeenNthCalledWith(3, expected)
  })

  it('passes robot and internet status to ConnectionStatusMessage', () => {
    mockGetInternetStatus.mockReturnValue(Networking.STATUS_FULL)

    const { wrapper } = render()
    const status = wrapper.find(ConnectionStatusMessage)

    expect(status.prop('status')).toEqual(mockRobot.status)
    expect(status.prop('ipAddress')).toEqual(mockRobot.ip)
    expect(status.prop('internetStatus')).toEqual(Networking.STATUS_FULL)
  })

  it('passes type ConnectionStatusMessage based on robot.local', () => {
    mockGetInternetStatus.mockReturnValue(Networking.STATUS_FULL)

    const localRobot: ViewableRobot = { ...mockRobot, local: true } as any
    const { wrapper: localWrapper } = render(localRobot)
    const localStatus = localWrapper.find(ConnectionStatusMessage)

    const wifiRobot: ViewableRobot = { ...mockRobot, local: false } as any
    const { wrapper: wifiWrapper } = render(wifiRobot)
    const wifiStatus = wifiWrapper.find(ConnectionStatusMessage)

    expect(localStatus.prop('type')).toEqual('USB')
    expect(wifiStatus.prop('type')).toEqual('Wi-Fi')
  })

  it('passes ethernet status to ConnectionInfo', () => {
    const mockEthernet = {
      ipAddress: null,
      subnetMask: null,
      macAddress: '00:00:00:00:00:00',
      type: Networking.INTERFACE_ETHERNET,
    }

    mockGetNetworkInterfaces.mockReturnValue({
      wifi: null,
      ethernet: mockEthernet,
    })

    const { wrapper } = render()
    const info = wrapper.find('ConnectionInfo[title="USB"]')

    expect(info.prop('connection')).toEqual(mockEthernet)
  })

  it('passes wifi status to ConnectionInfo', () => {
    const mockWifi = {
      ipAddress: null,
      subnetMask: null,
      macAddress: '00:00:00:00:00:00',
      type: Networking.INTERFACE_WIFI,
    }

    mockGetNetworkInterfaces.mockReturnValue({
      wifi: mockWifi,
      ethernet: null,
    })

    const { wrapper } = render()
    const info = wrapper.find('ConnectionInfo[title="Wi-Fi"]')

    expect(info.prop('connection')).toEqual(mockWifi)
  })

  it('renders SelectNetwork', () => {
    const { wrapper } = render()
    const select = wrapper.find(SelectNetwork)

    expect(select.prop('robotName')).toEqual(mockRobot.name)
  })
})
