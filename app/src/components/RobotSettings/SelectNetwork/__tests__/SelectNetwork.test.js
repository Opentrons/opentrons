// @flow

import * as React from 'react'
import { Provider } from 'react-redux'

import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'

import * as Networking from '../../../../networking'
import * as RobotApi from '../../../../robot-api'

import { SelectNetwork } from '..'
import { SelectSsid } from '../SelectSsid'
// import { SelectNetworkModal } from '../SelectNetworkModal'

import * as Fixtures from '../../../../networking/__fixtures__'
import * as Constants from '../constants'
import { ConnectModal } from '../ConnectModal'
import { DisconnectModal } from '../DisconnectModal'
import { JoinOtherModal } from '../JoinOtherModal'
import { InProgressModal } from '../InProgressModal'

import type { State } from '../../../../types'

jest.mock('../../../../networking/selectors')
jest.mock('../../../../robot-api/selectors')

const mockState = { state: true, mock: true }

const mockRobotName = 'robot-name'

const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  { ...Fixtures.mockWifiNetwork, ssid: 'baz' },
]

const mockGetWifiList: JestMockFn<
  [State, string],
  $Call<typeof Networking.getWifiList, State, string>
> = Networking.getWifiList

const mockGetCanDisconnect: JestMockFn<
  [State, string],
  $Call<typeof Networking.getCanDisconnect, State, string>
> = Networking.getCanDisconnect

const mockGetRequestById: JestMockFn<
  [State, string],
  $Call<typeof RobotApi.getRequestById, State, string>
> = RobotApi.getRequestById

describe('<SelectNetwork />', () => {
  let dispatch
  let mockStore
  let render

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      dispatch,
      subscribe: () => {},
      getState: () => mockState,
    }

    mockGetWifiList.mockReturnValue(mockWifiList)
    mockGetCanDisconnect.mockReturnValue(true)

    render = () => {
      return mount(<SelectNetwork robotName={mockRobotName} />, {
        wrappingComponent: Provider,
        wrappingComponentProps: { store: mockStore },
      })
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it.todo('dispatches fetchWifiList, fetchEapOptions, fetchWifiKeys on mount')

  it('renders an <SelectSsid /> child with props from state', () => {
    mockGetWifiList.mockImplementation((state, robotName) => {
      expect(state).toEqual(mockState)
      expect(robotName).toEqual(mockRobotName)
      return mockWifiList
    })

    mockGetCanDisconnect.mockImplementation((state, robotName) => {
      expect(state).toEqual(mockState)
      expect(robotName).toEqual(mockRobotName)
      return true
    })

    const wrapper = render()
    const selectSsid = wrapper.find(SelectSsid)
    expect(selectSsid.prop('list')).toEqual(mockWifiList)
    expect(selectSsid.prop('value')).toEqual('foo')
    expect(selectSsid.prop('showWifiDisconnect')).toEqual(true)
  })

  it('renders an <SelectSsid /> child with no active ssid and disconnect disabled', () => {
    mockGetWifiList.mockReturnValue(mockWifiList.slice(1))
    mockGetCanDisconnect.mockReturnValue(false)

    const wrapper = render()
    const selectSsid = wrapper.find(SelectSsid)
    expect(selectSsid.prop('list')).toEqual(mockWifiList.slice(1))
    expect(selectSsid.prop('value')).toEqual(null)
    expect(selectSsid.prop('showWifiDisconnect')).toEqual(false)
  })

  describe('disconnecting from the active network', () => {
    let wrapper
    let disconnectModal

    beforeEach(() => {
      wrapper = render()
      const selectSsid = wrapper.find(SelectSsid)

      act(() => {
        selectSsid.invoke('onDisconnect')()
      })
      wrapper.update()

      disconnectModal = wrapper.find(DisconnectModal)
    })

    it('renders a DisconnectModal on SelectSsid::onDisconnect', () => {
      expect(disconnectModal).toHaveLength(1)
      expect(disconnectModal.prop('ssid')).toEqual(mockWifiList[0].ssid)
    })

    it('passes onCancel prop that closes the modal', () => {
      act(() => {
        disconnectModal.invoke('onCancel')()
      })
      wrapper.update()

      expect(wrapper.find(DisconnectModal)).toHaveLength(0)
    })

    it('passes an onDisconnect prop that dispatches networking:POST_WIFI_DISCONNECT', () => {
      act(() => {
        disconnectModal.invoke('onDisconnect')()
      })
      wrapper.update()

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          ...Networking.postWifiDisconnect(mockRobotName, mockWifiList[0].ssid),
          meta: { requestId: expect.any(String) },
        })
      )
    })

    it('closes modal and shows a spinner while disconnect is in progress', () => {
      act(() => {
        disconnectModal.invoke('onDisconnect')()
        const actionCall = dispatch.mock.calls.find(
          call => call[0].type === Networking.POST_WIFI_DISCONNECT
        )
        const requestId = actionCall?.[0].meta.requestId

        mockGetRequestById.mockImplementation((state, reqId) => {
          expect(state).toEqual(mockState)
          return reqId === requestId ? { status: RobotApi.PENDING } : null
        })
      })
      wrapper.update()

      expect(wrapper.find(DisconnectModal)).toHaveLength(0)
      const inProgressModal = wrapper.find(InProgressModal)
      expect(inProgressModal).toHaveLength(1)
      expect(inProgressModal.props()).toEqual({
        type: Constants.DISCONNECT,
        ssid: mockWifiList[0].ssid,
      })
    })
  })

  describe('joining an unknown network', () => {
    let wrapper
    let joinOtherModal

    beforeEach(() => {
      wrapper = render()
      const selectSsid = wrapper.find(SelectSsid)

      act(() => {
        selectSsid.invoke('onJoinOther')()
      })
      wrapper.update()
      joinOtherModal = wrapper.find(JoinOtherModal)
    })

    it('renders a JoinOtherModal on SelectSsid::onJoinOther', () => {
      expect(joinOtherModal).toHaveLength(1)
    })

    it('passes onCancel prop that closes the modal', () => {
      act(() => {
        joinOtherModal.invoke('onCancel')()
      })
      wrapper.update()

      expect(wrapper.find(JoinOtherModal)).toHaveLength(0)
    })
  })

  describe('joining a new, known network', () => {
    let wrapper
    let connectModal

    beforeEach(() => {
      wrapper = render()
      const selectSsid = wrapper.find(SelectSsid)

      act(() => {
        selectSsid.invoke('onConnect')(mockWifiList[1].ssid)
      })
      wrapper.update()

      connectModal = wrapper.find(ConnectModal)
    })

    it('renders a ConnectModal on SelectSsid::onSelect', () => {
      expect(connectModal).toHaveLength(1)
      expect(connectModal.prop('network')).toEqual(mockWifiList[1])
    })

    it('passes onCancel prop that closes the modal', () => {
      act(() => {
        connectModal.invoke('onCancel')()
      })
      wrapper.update()

      expect(wrapper.find(ConnectModal)).toHaveLength(0)
    })
  })

  // revisit after networking refactors
  test.todo('on mount dispatches configure')

  // describe('<SelectNetworkModal />', () => {
  //   const newSsid = wifiList[2].ssid
  //   let wrapper
  //   let selectSsid

  //   beforeEach(() => {
  //     wrapper = render()
  //     selectSsid = wrapper.find(SelectSsid)
  //   })

  //   describe('onValueChange function', () => {
  //     test('updates state correctly', () => {
  //       act(() => {
  //         selectSsid.props().onValueChange(newSsid)
  //       })
  //       wrapper.update()
  //       const modal = wrapper.find(SelectNetworkModal)

  //       expect(modal.prop('ssid')).toEqual(newSsid)
  //       expect(modal.prop('previousSsid')).toEqual(wifiList[0].ssid)
  //       expect(modal.prop('networkingType')).toEqual('connect')
  //       expect(modal.prop('securityType')).toEqual(wifiList[2].securityType)
  //       expect(modal.prop('modalOpen')).toEqual(true)
  //     })

  //     // revisit after additional networking refactors
  //     test.todo('when security type is none dispatches configure correctly')

  //     test.todo(
  //       'when has WPA or EAP security type dispatches fetchWifiEapOptions correctly'
  //     )
  //     test.todo(
  //       'when has WPA or EAP security type dispatches fetchWifiKeys correctly'
  //     )
  //   })

  //   test('onCancel function updates state correctly', () => {
  //     act(() => {
  //       selectSsid.props().onValueChange(newSsid)
  //     })

  //     wrapper.update()
  //     let modal = wrapper.find(SelectNetworkModal)

  //     act(() => {
  //       modal.props().onCancel()
  //     })
  //     wrapper.update()
  //     modal = wrapper.find(SelectNetworkModal)

  //     expect(modal.prop('ssid')).toEqual(wifiList[0].ssid)
  //     expect(modal.prop('previousSsid')).toEqual(null)
  //     expect(modal.prop('networkingType')).toEqual('connect')
  //     expect(modal.prop('securityType')).toEqual(wifiList[0].securityType)
  //     expect(modal.prop('modalOpen')).toEqual(false)
  //   })
  // })

  // describe('onDisconnectWifi function', () => {
  //   test('dispatches postDisconnectNetwork and closes modal when previousSsid is present', () => {
  //     const wrapper = render()
  //     const newSsid = 'Opentrons'
  //     const selectSsid = wrapper.find(SelectSsid)
  //     act(() => {
  //       selectSsid.props().onValueChange(newSsid)
  //     })
  //     wrapper.update()
  //     let modal = wrapper.find(SelectNetworkModal)

  //     // TODO: (isk: 2/27/20): Potentially move into utils mock
  //     const expected = {
  //       ...Networking.postWifiDisconnect(
  //         mockRobot.name,
  //         modal.prop('previousSsid')
  //       ),
  //       meta: { requestId: 'robotApi_request_1' },
  //     }

  //     jest.clearAllMocks()

  //     expect(modal.prop('modalOpen')).toEqual(true)

  //     act(() => {
  //       modal.props().onDisconnectWifi()
  //     })

  //     wrapper.update()
  //     modal = wrapper.find(SelectNetworkModal)

  //     expect(dispatch).toHaveBeenCalledWith(expected)
  //     expect(modal.prop('modalOpen')).toEqual(false)
  //   })

  //   test('does not dispatch postDisconnectNetwork and modal remains open when previousSsid is not present', () => {
  //     const wrapper = render()
  //     let modal = wrapper.find(SelectNetworkModal)

  //     jest.clearAllMocks()

  //     expect(modal.prop('modalOpen')).toEqual(false)

  //     act(() => {
  //       modal.props().onDisconnectWifi()
  //     })

  //     wrapper.update()
  //     modal = wrapper.find(SelectNetworkModal)

  //     expect(dispatch).not.toHaveBeenCalled()
  //     expect(modal.prop('modalOpen')).toEqual(false)
  //   })
  // })
})
