import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'

import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'

import { useWifiList } from '../../../../resources/networking/hooks'
import * as Networking from '../../../../redux/networking'
import * as RobotApi from '../../../../redux/robot-api'
import * as Fixtures from '../../../../redux/networking/__fixtures__'
import * as Constants from '../ConnectNetwork/constants'

import { Portal } from '../../../../App/portal'
import { SelectSsid } from '../ConnectNetwork/SelectSsid'
import { ConnectModal } from '../ConnectNetwork/ConnectModal'
import { ResultModal } from '../ConnectNetwork/ResultModal'

import { SelectNetwork } from '../SelectNetwork'
import { RequestState } from '../../../../redux/robot-api/types'
import { PENDING, SUCCESS, FAILURE } from '../../../../redux/robot-api'

import type { ReactWrapper } from 'enzyme'

jest.mock('../../../../resources/networking/hooks')
jest.mock('../../../../redux/networking/selectors')
jest.mock('../../../../redux/robot-api/selectors')

// mock out ConnectModal to prevent warning logs from async formik
// validation happening outside an `act`
jest.mock('../ConnectNetwork/ConnectModal', () => ({
  ConnectModal: () => <></>,
}))

const mockState = { state: true, mock: true }

const mockRobotName = 'robot-name'

const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  {
    ...Fixtures.mockWifiNetwork,
    ssid: 'baz',
    securityType: Networking.SECURITY_NONE,
  },
]

const mockWifiKeys = [
  { ...Fixtures.mockWifiKey, id: 'abc' },
  { ...Fixtures.mockWifiKey, id: 'def' },
  { ...Fixtures.mockWifiKey, id: 'ghi' },
]

const mockEapOptions = [Fixtures.mockEapOption]

const mockUseWifiList = useWifiList as jest.MockedFunction<typeof useWifiList>

const mockGetWifiKeys = Networking.getWifiKeys as jest.MockedFunction<
  typeof Networking.getWifiKeys
>

const mockGetEapOptions = Networking.getEapOptions as jest.MockedFunction<
  typeof Networking.getEapOptions
>

const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>

describe('<TemporarySelectNetwork />', () => {
  let dispatch: any
  let mockStore: any

  let render: () => ReactWrapper<React.ComponentProps<typeof SelectNetwork>>

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      dispatch,
      subscribe: () => {},
      getState: () => mockState,
    }

    jest.useFakeTimers()

    when(mockUseWifiList)
      .calledWith(mockRobotName)
      .mockReturnValue(mockWifiList)

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

    render = () => {
      return mount(
        <SelectNetwork robotName={mockRobotName} isRobotBusy={false} />,
        {
          wrappingComponent: Provider,
          wrappingComponentProps: { store: mockStore },
        }
      )
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
    resetAllWhenMocks()
  })

  it('renders an <SelectSsid /> child with props from state', () => {
    const wrapper = render()
    const selectSsid = wrapper.find(SelectSsid)
    expect(selectSsid.prop('list')).toEqual(mockWifiList)
    expect(selectSsid.prop('value')).toEqual('foo')
  })

  it('renders an <SelectSsid /> child with no active ssid', () => {
    when(mockUseWifiList)
      .calledWith(mockRobotName)
      .mockReturnValue(mockWifiList.slice(1))

    const wrapper = render()
    const selectSsid = wrapper.find(SelectSsid)
    expect(selectSsid.prop('list')).toEqual(mockWifiList.slice(1))
    expect(selectSsid.prop('value')).toEqual(null)
  })

  describe('joining a network', () => {
    let wrapper: ReactWrapper<React.ComponentProps<typeof SelectNetwork>>
    let connectModal: ReactWrapper<React.ComponentProps<typeof ConnectModal>>

    beforeEach(() => {
      wrapper = render()
      const selectSsid = wrapper.find(SelectSsid)
      dispatch.mockReset()

      act(() => {
        selectSsid.invoke('onConnect')?.(mockWifiList[1].ssid)
      })
      wrapper.update()

      connectModal = wrapper.find(ConnectModal)
    })

    it('renders a ConnectModal on SelectSsid::onSelect', () => {
      expect(connectModal).toHaveLength(1)
      expect(connectModal.props()).toEqual({
        robotName: mockRobotName,
        network: mockWifiList[1],
        wifiKeys: mockWifiKeys,
        eapOptions: mockEapOptions,
        onConnect: expect.any(Function),
        onCancel: expect.any(Function),
      })
    })

    it('dispatches fetchEapOptions and fetchWifiKeys on SelectSsid::onSelect', () => {
      const expectedFetchEap = Networking.fetchEapOptions(mockRobotName)
      const expectedFetchKeys = Networking.fetchEapOptions(mockRobotName)

      expect(dispatch).toHaveBeenCalledWith(expectedFetchEap)
      expect(dispatch).toHaveBeenCalledWith(expectedFetchKeys)
    })

    it('renders a ConnectModal with network={null} on SelectSsid::onJoinOther', () => {
      wrapper = render()
      const selectSsid = wrapper.find(SelectSsid)

      act(() => {
        selectSsid.invoke('onJoinOther')?.()
      })
      wrapper.update()
      connectModal = wrapper.find(Portal).find(ConnectModal)

      expect(connectModal).toHaveLength(1)
      expect(connectModal.props()).toEqual({
        robotName: mockRobotName,
        network: null,
        wifiKeys: mockWifiKeys,
        eapOptions: mockEapOptions,
        onConnect: expect.any(Function),
        onCancel: expect.any(Function),
      })
    })

    it('dispatches fetchEapOptions and fetchWifiKeys on SelectSsid::onJoinOther', () => {
      wrapper = render()
      const selectSsid = wrapper.find(SelectSsid)
      dispatch.mockReset()

      act(() => {
        selectSsid.invoke('onJoinOther')?.()
      })

      const expectedFetchEap = Networking.fetchEapOptions(mockRobotName)
      const expectedFetchKeys = Networking.fetchEapOptions(mockRobotName)

      expect(dispatch).toHaveBeenCalledWith(expectedFetchEap)
      expect(dispatch).toHaveBeenCalledWith(expectedFetchKeys)
    })

    it('passes onCancel prop that closes the modal', () => {
      act(() => {
        connectModal.invoke('onCancel')?.()
      })
      wrapper.update()

      expect(wrapper.find(ConnectModal)).toHaveLength(0)
    })

    describe('dispatching the request', () => {
      const mockConfigure = { ssid: mockWifiList[1].ssid, psk: 'password' }
      let requestId: string | null

      const connectAndSetMockRequestState = (
        requestState: RequestState | null = null
      ) => {
        act(() => {
          connectModal.invoke('onConnect')?.(mockConfigure)
          const actionCall = dispatch.mock.calls.find(
            (call: any) => call[0].type === Networking.POST_WIFI_CONFIGURE
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
        const resultModal = wrapper.find(Portal).find(ResultModal)
        expect(resultModal).toHaveLength(1)
        expect(resultModal.props()).toEqual({
          type: Constants.CONNECT,
          ssid: mockConfigure.ssid,
          requestStatus: PENDING,
          error: null,
          onClose: expect.any(Function),
        })
      })

      it('closes spinner and shows success if connect succeeds', () => {
        connectAndSetMockRequestState({
          status: RobotApi.SUCCESS,
          response: {} as any,
        })

        expect(wrapper.find(ConnectModal)).toHaveLength(0)
        const resultModal = wrapper.find(Portal).find(ResultModal)
        expect(resultModal).toHaveLength(1)
        expect(resultModal.props()).toEqual({
          type: Constants.CONNECT,
          ssid: mockConfigure.ssid,
          requestStatus: SUCCESS,
          error: null,
          onClose: expect.any(Function),
        })

        act(() => {
          resultModal.invoke('onClose')?.()
        })
        wrapper.update()

        expect(wrapper.find(ResultModal)).toHaveLength(0)
        expect(dispatch).toHaveBeenCalledWith(
          RobotApi.dismissRequest(requestId as any)
        )
      })

      it('closes spinner and shows failure if connect fails', () => {
        connectAndSetMockRequestState({
          status: RobotApi.FAILURE,
          response: {} as any,
          error: { message: 'oh no!' },
        })

        expect(wrapper.find(ConnectModal)).toHaveLength(0)
        const resultModal = wrapper.find(Portal).find(ResultModal)
        expect(resultModal).toHaveLength(1)
        expect(resultModal.props()).toEqual({
          type: Constants.CONNECT,
          ssid: mockConfigure.ssid,
          requestStatus: FAILURE,
          error: { message: 'oh no!' },
          onClose: expect.any(Function),
        })

        act(() => {
          resultModal.invoke('onClose')?.()
        })
        wrapper.update()

        expect(wrapper.find(ResultModal)).toHaveLength(0)
        expect(dispatch).toHaveBeenCalledWith(
          RobotApi.dismissRequest(requestId as any)
        )
      })

      it('dispatches a configure request immediately for an open network', () => {
        wrapper = render()

        const selectSsid = wrapper.find(SelectSsid)
        const expectedConfigure = {
          ssid: mockWifiList[2].ssid,
          securityType: Networking.SECURITY_NONE,
          hidden: false,
        }

        act(() => {
          selectSsid.invoke('onConnect')?.(mockWifiList[2].ssid)
        })
        wrapper.update()

        expect(dispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            ...Networking.postWifiConfigure(mockRobotName, expectedConfigure),
            meta: { requestId: expect.any(String) },
          })
        )
      })
    })
  })
})
