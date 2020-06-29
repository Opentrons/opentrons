// @flow
import { mount } from 'enzyme'
import * as React from 'react'
import { Provider } from 'react-redux'

import { CONNECTABLE } from '../../../discovery'
import type { ViewableRobot } from '../../../discovery/types'
import * as Networking from '../../../networking'
import type { State } from '../../../types'
import { ConnectionStatusMessage } from '../connection'
import { ConnectionCard } from '../ConnectionCard'
import { SelectNetwork } from '../SelectNetwork'

jest.mock('../../../networking/selectors')
jest.mock('../../../components/RobotSettings/SelectNetwork', () => ({
  SelectNetwork: () => {
    return <></>
  },
}))

const mockRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
}: any)

const mockGetInternetStatus: JestMockFn<
  [State, string],
  $Call<typeof Networking.getInternetStatus, State, string>
> = Networking.getInternetStatus

const mockGetNetworkInterfaces: JestMockFn<
  [State, string],
  $Call<typeof Networking.getNetworkInterfaces, State, string>
> = Networking.getNetworkInterfaces

describe('ConnectionCard', () => {
  let dispatch
  let mockStore
  let render

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      dispatch,
      subscribe: () => {},
      getState: () => ({ mockState: true }),
    }
    jest.useFakeTimers()

    mockGetInternetStatus.mockReturnValue(null)
    mockGetNetworkInterfaces.mockReturnValue({ wifi: null, ethernet: null })

    render = (robot: ViewableRobot = mockRobot) => {
      return mount(<ConnectionCard robot={robot} />, {
        wrappingComponent: Provider,
        wrappingComponentProps: { store: mockStore },
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
    render()
    expect(dispatch).toHaveBeenCalledWith(expected)
  })

  it('calls fetchStatus on an interval', () => {
    const expected = Networking.fetchStatus(mockRobot.name)

    render()
    jest.advanceTimersByTime(10000)
    expect(dispatch).toHaveBeenNthCalledWith(1, expected)
    expect(dispatch).toHaveBeenNthCalledWith(2, expected)
    expect(dispatch).toHaveBeenNthCalledWith(3, expected)
  })

  it('passes internet status to ConnectionStatusMessage', () => {
    mockGetInternetStatus.mockReturnValue(Networking.STATUS_FULL)

    const wrapper = render()
    const status = wrapper.find(ConnectionStatusMessage)

    expect(status.prop('status')).toEqual(Networking.STATUS_FULL)
  })

  it('passes type ConnectionStatusMessage based on robot.local', () => {
    mockGetInternetStatus.mockReturnValue(Networking.STATUS_FULL)

    const localRobot: ViewableRobot = ({ ...mockRobot, local: true }: any)
    const localWrapper = render(localRobot)
    const localStatus = localWrapper.find(ConnectionStatusMessage)

    const wifiRobot: ViewableRobot = ({ ...mockRobot, local: false }: any)
    const wifiWrapper = render(wifiRobot)
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

    const wrapper = render()
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

    const wrapper = render()
    const info = wrapper.find('ConnectionInfo[title="Wi-Fi"]')

    expect(info.prop('connection')).toEqual(mockWifi)
  })

  it('renders SelectNetwork', () => {
    const wrapper = render()
    const select = wrapper.find(SelectNetwork)

    expect(select.prop('robotName')).toEqual(mockRobot.name)
  })
})
