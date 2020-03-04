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
import { InProgressModal } from '../InProgressModal'
import { SuccessModal } from '../SuccessModal'
import { FailureModal } from '../FailureModal'

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

const mockWifiKeys = [
  { ...Fixtures.mockWifiKey, id: 'abc' },
  { ...Fixtures.mockWifiKey, id: 'def' },
  { ...Fixtures.mockWifiKey, id: 'ghi' },
]

const mockEapOptions = [Fixtures.mockEapOption]

const mockGetWifiList: JestMockFn<
  [State, string],
  $Call<typeof Networking.getWifiList, State, string>
> = Networking.getWifiList

const mockGetWifiKeys: JestMockFn<
  [State, string],
  $Call<typeof Networking.getWifiKeys, State, string>
> = Networking.getWifiKeys

const mockGetEapOptions: JestMockFn<
  [State, string],
  $Call<typeof Networking.getEapOptions, State, string>
> = Networking.getEapOptions

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

    jest.useFakeTimers()

    mockGetWifiList.mockImplementation((state, robotName) => {
      expect(state).toEqual(mockState)
      expect(robotName).toEqual(mockRobotName)
      return mockWifiList
    })

    mockGetWifiKeys.mockImplementation((state, robotName) => {
      expect(state).toEqual(mockState)
      expect(robotName).toEqual(mockRobotName)
      return mockWifiKeys
    })

    mockGetEapOptions.mockImplementation((state, robotName) => {
      expect(state).toEqual(mockState)
      expect(robotName).toEqual(mockRobotName)
      return mockEapOptions
    })

    mockGetCanDisconnect.mockImplementation((state, robotName) => {
      expect(state).toEqual(mockState)
      expect(robotName).toEqual(mockRobotName)
      return true
    })

    render = () => {
      return mount(<SelectNetwork robotName={mockRobotName} />, {
        wrappingComponent: Provider,
        wrappingComponentProps: { store: mockStore },
      })
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('dispatches fetchEapOptions, fetchWifiKeys on mount and fetchWifiList on an interval', () => {
    const expectedFetchList = Networking.fetchWifiList(mockRobotName)

    render()
    expect(dispatch).toHaveBeenNthCalledWith(1, expectedFetchList)
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      Networking.fetchEapOptions(mockRobotName)
    )
    expect(dispatch).toHaveBeenNthCalledWith(
      3,
      Networking.fetchWifiKeys(mockRobotName)
    )
    expect(dispatch).toHaveBeenCalledTimes(3)
    jest.advanceTimersByTime(20000)
    expect(dispatch).toHaveBeenNthCalledWith(4, expectedFetchList)
    expect(dispatch).toHaveBeenNthCalledWith(5, expectedFetchList)
  })

  it('renders an <SelectSsid /> child with props from state', () => {
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

    describe('dispatching the request', () => {
      let requestId

      const disconnectAndSetMockRequestState = (requestState = null) => {
        act(() => {
          disconnectModal.invoke('onDisconnect')()
          const actionCall = dispatch.mock.calls.find(
            call => call[0].type === Networking.POST_WIFI_DISCONNECT
          )
          requestId = actionCall?.[0].meta.requestId

          mockGetRequestById.mockImplementation((state, reqId) => {
            expect(state).toEqual(mockState)
            return reqId === requestId ? requestState : null
          })
        })
        wrapper.update()
      }

      it('passes an onDisconnect prop that dispatches networking:POST_WIFI_DISCONNECT', () => {
        disconnectAndSetMockRequestState()

        expect(dispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            ...Networking.postWifiDisconnect(
              mockRobotName,
              mockWifiList[0].ssid
            ),
            meta: { requestId: expect.any(String) },
          })
        )
      })

      it('closes modal and shows a spinner while disconnect is in progress', () => {
        disconnectAndSetMockRequestState({ status: RobotApi.PENDING })

        expect(wrapper.find(DisconnectModal)).toHaveLength(0)
        const inProgressModal = wrapper.find(InProgressModal)
        expect(inProgressModal).toHaveLength(1)
        expect(inProgressModal.props()).toEqual({
          type: Constants.DISCONNECT,
          ssid: mockWifiList[0].ssid,
        })
      })

      it('closes spinner and shows success when disconnect succeeds', () => {
        disconnectAndSetMockRequestState({
          status: RobotApi.SUCCESS,
          response: ({}: any),
        })

        expect(wrapper.find(DisconnectModal)).toHaveLength(0)
        expect(wrapper.find(InProgressModal)).toHaveLength(0)
        const successModal = wrapper.find(SuccessModal)
        expect(successModal).toHaveLength(1)
        expect(successModal.props()).toEqual({
          type: Constants.DISCONNECT,
          ssid: mockWifiList[0].ssid,
          onClose: expect.any(Function),
        })

        act(() => {
          successModal.invoke('onClose')()
        })
        wrapper.update()

        expect(wrapper.find(SuccessModal)).toHaveLength(0)
        expect(dispatch).toHaveBeenCalledWith(
          RobotApi.dismissRequest(((requestId: any): string))
        )
      })

      it('closes spinner and shows failure if disconnect fails', () => {
        disconnectAndSetMockRequestState({
          status: RobotApi.FAILURE,
          response: ({}: any),
          error: { message: 'oh no!' },
        })

        expect(wrapper.find(DisconnectModal)).toHaveLength(0)
        expect(wrapper.find(InProgressModal)).toHaveLength(0)
        const failureModal = wrapper.find(FailureModal)
        expect(failureModal).toHaveLength(1)
        expect(failureModal.props()).toEqual({
          type: Constants.DISCONNECT,
          ssid: mockWifiList[0].ssid,
          error: { message: 'oh no!' },
          onClose: expect.any(Function),
        })

        act(() => {
          failureModal.invoke('onClose')()
        })
        wrapper.update()

        expect(wrapper.find(FailureModal)).toHaveLength(0)
        expect(dispatch).toHaveBeenCalledWith(
          RobotApi.dismissRequest(((requestId: any): string))
        )
      })
    })
  })

  describe('joining a network', () => {
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
      expect(connectModal.props()).toEqual({
        network: mockWifiList[1],
        wifiKeys: mockWifiKeys,
        eapOptions: mockEapOptions,
        onConnect: expect.any(Function),
        onCancel: expect.any(Function),
      })
    })

    it('renders a ConnectModal with network={null} on SelectSsid::onJoinOther', () => {
      wrapper = render()
      const selectSsid = wrapper.find(SelectSsid)

      act(() => {
        selectSsid.invoke('onJoinOther')()
      })
      wrapper.update()
      connectModal = wrapper.find(ConnectModal)

      expect(connectModal).toHaveLength(1)
      expect(connectModal.props()).toEqual({
        network: null,
        wifiKeys: mockWifiKeys,
        eapOptions: mockEapOptions,
        onConnect: expect.any(Function),
        onCancel: expect.any(Function),
      })
    })

    it('passes onCancel prop that closes the modal', () => {
      act(() => {
        connectModal.invoke('onCancel')()
      })
      wrapper.update()

      expect(wrapper.find(ConnectModal)).toHaveLength(0)
    })

    describe('dispatching the request', () => {
      const mockConfigure = { ssid: mockWifiList[1].ssid, psk: 'password' }
      let requestId

      const connectAndSetMockRequestState = (requestState = null) => {
        act(() => {
          connectModal.invoke('onConnect')(mockConfigure)
          const actionCall = dispatch.mock.calls.find(
            call => call[0].type === Networking.POST_WIFI_CONFIGURE
          )
          requestId = actionCall?.[0].meta.requestId

          mockGetRequestById.mockImplementation((state, reqId) => {
            expect(state).toEqual(mockState)
            return reqId === requestId ? requestState : null
          })
        })
        wrapper.update()
      }

      it('passes an onConnect prop that dispatches networking:POST_WIFI_CONFIGURE', () => {
        connectAndSetMockRequestState()

        expect(dispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            ...Networking.postWifiConfigure(mockRobotName, mockConfigure),
            meta: { requestId: expect.any(String) },
          })
        )
      })

      it('closes modal and shows a spinner while disconnect is in progress', () => {
        connectAndSetMockRequestState({ status: RobotApi.PENDING })

        expect(wrapper.find(ConnectModal)).toHaveLength(0)
        const inProgressModal = wrapper.find(InProgressModal)
        expect(inProgressModal).toHaveLength(1)
        expect(inProgressModal.props()).toEqual({
          type: Constants.CONNECT,
          ssid: mockConfigure.ssid,
        })
      })

      it('closes spinner and shows success if connect succeeds', () => {
        connectAndSetMockRequestState({
          status: RobotApi.SUCCESS,
          response: ({}: any),
        })

        expect(wrapper.find(ConnectModal)).toHaveLength(0)
        expect(wrapper.find(InProgressModal)).toHaveLength(0)
        const successModal = wrapper.find(SuccessModal)
        expect(successModal).toHaveLength(1)
        expect(successModal.props()).toEqual({
          type: Constants.CONNECT,
          ssid: mockConfigure.ssid,
          onClose: expect.any(Function),
        })

        act(() => {
          successModal.invoke('onClose')()
        })
        wrapper.update()

        expect(wrapper.find(SuccessModal)).toHaveLength(0)
        expect(dispatch).toHaveBeenCalledWith(
          RobotApi.dismissRequest(((requestId: any): string))
        )
      })

      it('closes spinner and shows failure if connect fails', () => {
        connectAndSetMockRequestState({
          status: RobotApi.FAILURE,
          response: ({}: any),
          error: { message: 'oh no!' },
        })

        expect(wrapper.find(ConnectModal)).toHaveLength(0)
        expect(wrapper.find(InProgressModal)).toHaveLength(0)
        const failureModal = wrapper.find(FailureModal)
        expect(failureModal).toHaveLength(1)
        expect(failureModal.props()).toEqual({
          type: Constants.CONNECT,
          ssid: mockConfigure.ssid,
          error: { message: 'oh no!' },
          onClose: expect.any(Function),
        })

        act(() => {
          failureModal.invoke('onClose')()
        })
        wrapper.update()

        expect(wrapper.find(FailureModal)).toHaveLength(0)
        expect(dispatch).toHaveBeenCalledWith(
          RobotApi.dismissRequest(((requestId: any): string))
        )
      })
    })
  })
})
