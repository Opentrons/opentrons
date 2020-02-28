// @flow

import * as React from 'react'
import { Provider } from 'react-redux'

import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'

import * as Networking from '../../../../networking'

import { SelectNetwork } from '..'
import { SelectSsid } from '../SelectSsid'
import { SelectNetworkModal } from '../SelectNetworkModal'

import type { State } from '../../../../types'
import type { ViewableRobot } from '../../../../discovery/types'

// TODO: (isk: 2/27/20): Remove mockState when hooks selectors are refactored
import { mockState, mockRobot, wifiList } from '../__fixtures__'

jest.mock('../../../../networking/selectors')

const mockGetWifiList: JestMockFn<
  [State, string],
  $Call<typeof Networking.getWifiList, State, string>
> = Networking.getWifiList

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

    render = (robot: ViewableRobot = mockRobot) => {
      mockGetWifiList.mockImplementation((state, robotName) => {
        expect(state).toEqual(mockState)
        expect(robotName).toEqual(robot.name)
        return wifiList
      })

      return mount(<SelectNetwork robot={robot} />, {
        wrappingComponent: Provider,
        wrappingComponentProps: { store: mockStore },
      })
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders component correctly', () => {
    const wrapper = render()
    expect(wrapper.prop('robot')).toEqual(mockRobot)
  })

  test('renders <SelectSsid /> correctly', () => {
    const wrapper = render()
    const selectSsid = wrapper.find(SelectSsid)
    expect(selectSsid.prop('list')).toEqual(wifiList)
    expect(selectSsid.prop('disabled')).toEqual(false)
  })

  // revisit after networking refactors
  test.todo('on mount dispatches configure')

  describe('<SelectNetworkModal />', () => {
    const newSsid = wifiList[2].ssid
    let wrapper
    let selectSsid

    beforeEach(() => {
      wrapper = render()
      selectSsid = wrapper.find(SelectSsid)
    })

    describe('onValueChange function', () => {
      test('updates state correctly', () => {
        act(() => {
          selectSsid.props().onValueChange(newSsid)
        })
        wrapper.update()
        const modal = wrapper.find(SelectNetworkModal)

        expect(modal.prop('ssid')).toEqual(newSsid)
        expect(modal.prop('previousSsid')).toEqual(wifiList[0].ssid)
        expect(modal.prop('networkingType')).toEqual('connect')
        expect(modal.prop('securityType')).toEqual(wifiList[2].securityType)
        expect(modal.prop('modalOpen')).toEqual(true)
      })

      // revisit after additional networking refactors
      test.todo('when security type is none dispatches configure correctly')

      test.todo(
        'when has WPA or EAP security type dispatches fetchWifiEapOptions correctly'
      )
      test.todo(
        'when has WPA or EAP security type dispatches fetchWifiKeys correctly'
      )
    })

    test('onCancel function updates state correctly', () => {
      act(() => {
        selectSsid.props().onValueChange(newSsid)
      })

      wrapper.update()
      let modal = wrapper.find(SelectNetworkModal)

      act(() => {
        modal.props().onCancel()
      })
      wrapper.update()
      modal = wrapper.find(SelectNetworkModal)

      expect(modal.prop('ssid')).toEqual(wifiList[0].ssid)
      expect(modal.prop('previousSsid')).toEqual(null)
      expect(modal.prop('networkingType')).toEqual('connect')
      expect(modal.prop('securityType')).toEqual(wifiList[0].securityType)
      expect(modal.prop('modalOpen')).toEqual(false)
    })
  })

  describe('onDisconnectWifi function', () => {
    test('dispatches postDisconnectNetwork and closes modal when previousSsid is present', () => {
      const wrapper = render()
      const newSsid = 'Opentrons'
      const selectSsid = wrapper.find(SelectSsid)
      act(() => {
        selectSsid.props().onValueChange(newSsid)
      })
      wrapper.update()
      let modal = wrapper.find(SelectNetworkModal)

      // TODO: (isk: 2/27/20): Potentially move into utils mock
      const expected = {
        ...Networking.postWifiDisconnect(
          mockRobot.name,
          modal.prop('previousSsid')
        ),
        meta: { requestId: 'robotApi_request_1' },
      }

      jest.clearAllMocks()

      expect(modal.prop('modalOpen')).toEqual(true)

      act(() => {
        modal.props().onDisconnectWifi()
      })

      wrapper.update()
      modal = wrapper.find(SelectNetworkModal)

      expect(dispatch).toHaveBeenCalledWith(expected)
      expect(modal.prop('modalOpen')).toEqual(false)
    })

    test('does not dispatch postDisconnectNetwork and modal remains open when previousSsid is not present', () => {
      const wrapper = render()
      let modal = wrapper.find(SelectNetworkModal)

      jest.clearAllMocks()

      expect(modal.prop('modalOpen')).toEqual(false)

      act(() => {
        modal.props().onDisconnectWifi()
      })

      wrapper.update()
      modal = wrapper.find(SelectNetworkModal)

      expect(dispatch).not.toHaveBeenCalled()
      expect(modal.prop('modalOpen')).toEqual(false)
    })
  })
})
