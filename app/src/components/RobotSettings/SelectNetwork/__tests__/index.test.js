// @flow

import * as React from 'react'
import { Provider } from 'react-redux'

import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'

import * as Networking from '../../../../networking'
import { CONNECTABLE } from '../../../../discovery'

import { SelectNetwork } from '..'
import { SelectSsid } from '../SelectSsid'
import { SelectNetworkModal } from '../SelectNetworkModal'

import type { State } from '../../../types'
import type { ViewableRobot } from '../../../../discovery/types'

const mockRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
}: any)

const wifiList = [
  {
    ssid: 'Test',
    signal: 100,
    active: true,
    security: 'WPA2',
    securityType: 'wpa-psk',
  },
  {
    ssid: 'Opentrons',
    signal: 100,
    active: false,
    security: 'WPA2',
    securityType: 'wpa-psk',
  },
]

const mockState = {
  networking: {
    'robot-name': {
      wifiList,
    },
  },
  superDeprecatedRobotApi: {
    api: { 'robot-name': {} },
  },
  robotApi: {},
}

describe('<SelectNetwork />', () => {
  let dispatch
  let mockStore
  let render

  beforeEach(() => {
    dispatch = jest.fn()
    mockStore = {
      dispatch,
      subscribe: () => {},
      getState: () => ({ ...mockState }: State),
    }

    render = (robot: ViewableRobot = mockRobot) =>
      mount(<SelectNetwork robot={robot} />, {
        wrappingComponent: Provider,
        wrappingComponentProps: { store: mockStore },
      })
  })

  afterEach(() => {
    jest.resetAllMocks()
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

  describe('SelectNetworkModal modal', () => {
    const newSsid = 'Opentrons'
    let wrapper
    let modal

    beforeEach(() => {
      wrapper = render()
      const selectSsid = wrapper.find(SelectSsid)
      act(() => {
        selectSsid.props().handleOnValueChange(newSsid)
      })
      wrapper.update()
      modal = wrapper.find(SelectNetworkModal)
    })

    test('handleOnValueChange function updates state correctly', () => {
      expect(modal.prop('ssid')).toEqual(newSsid)
      expect(modal.prop('previousSsid')).toEqual(wifiList[0].ssid)
      expect(modal.prop('networkingType')).toEqual('connect')
      expect(modal.prop('securityType')).toEqual(wifiList[1].securityType)
      expect(modal.prop('modalOpen')).toEqual(true)
    })

    test('onClick handleCancel function updates state correctly', () => {
      act(() => {
        modal.props().handleCancel()
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

  describe('handleDisconnectWifi function', () => {
    test('dispatches postDisconnectNetwork and closes modal when previousSsid is present', () => {
      const wrapper = render()
      const newSsid = 'Opentrons'
      const selectSsid = wrapper.find(SelectSsid)
      act(() => {
        selectSsid.props().handleOnValueChange(newSsid)
      })
      wrapper.update()
      let modal = wrapper.find(SelectNetworkModal)

      const expected = {
        ...Networking.postDisconnectNetwork(
          mockRobot.name,
          modal.prop('previousSsid')
        ),
        meta: { requestId: 'robotApi_request_1' },
      }

      jest.clearAllMocks()

      expect(modal.prop('modalOpen')).toEqual(true)

      act(() => {
        modal.props().handleDisconnectWifi()
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
        modal.props().handleDisconnectWifi()
      })

      wrapper.update()
      modal = wrapper.find(SelectNetworkModal)

      expect(dispatch).not.toHaveBeenCalled()
      expect(modal.prop('modalOpen')).toEqual(false)
    })
  })
})
