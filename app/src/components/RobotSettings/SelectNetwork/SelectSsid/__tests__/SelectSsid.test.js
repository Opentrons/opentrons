// @flow
import * as React from 'react'
import { shallow } from 'enzyme'
import { SelectField } from '@opentrons/components'

import * as Fixtures from '../../../../../networking/__fixtures__'
import * as Constants from '../constants'
import { SelectSsid } from '..'
import { NetworkOptionLabel } from '../NetworkOptionLabel'

const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  { ...Fixtures.mockWifiNetwork, ssid: 'baz' },
]

describe('SelectSsid component', () => {
  const handleConnect = jest.fn()
  const handleJoinOther = jest.fn()
  const handleDisconnect = jest.fn()

  const render = (showDisconnect = true) => {
    return shallow(
      <SelectSsid
        list={mockWifiList}
        value={null}
        onConnect={handleConnect}
        onJoinOther={handleJoinOther}
        onDisconnect={handleDisconnect}
        showWifiDisconnect={showDisconnect}
      />
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a SelectField', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    expect(selectField).toHaveLength(1)
  })

  it('maps ssid list to an ssid option group', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)
    const options = selectField.prop('options')

    expect(options).toContainEqual({
      options: [{ value: 'foo' }, { value: 'bar' }, { value: 'baz' }],
    })
  })

  it('adds an option group for join other network', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)
    const options = selectField.prop('options')

    expect(options).toContainEqual({
      options: [
        {
          value: Constants.JOIN_OTHER_VALUE,
          label: Constants.JOIN_OTHER_LABEL,
        },
      ],
    })
  })

  it('adds an option group for disconnect if showWifiDisconnect = true', () => {
    const wrapper = render(true)
    const selectField = wrapper.find(SelectField)
    const options = selectField.prop('options')

    expect(options).toContainEqual({
      options: [
        {
          value: Constants.DISCONNECT_WIFI_VALUE,
          label: Constants.DISCONNECT_WIFI_LABEL,
        },
      ],
    })
  })

  it('does not add an option group for disconnect if showWifiDisconnect = false', () => {
    const wrapper = render(false)
    const selectField = wrapper.find(SelectField)
    const options = selectField.prop('options')

    expect(options).not.toContainEqual({
      options: [{ value: Constants.DISCONNECT_WIFI_VALUE }],
    })
  })

  it('if user selects ssid value, onSelect is called with ssid', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    selectField.invoke('onValueChange')('_', 'foo')

    expect(handleConnect).toHaveBeenCalledWith('foo')
  })

  it('if user selects join other value, onJoinOther is called', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    selectField.invoke('onValueChange')('_', Constants.JOIN_OTHER_VALUE)

    expect(handleJoinOther).toHaveBeenCalled()
  })

  it('if user selects disconnect value, onDisconnect is called', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    selectField.invoke('onValueChange')('_', Constants.DISCONNECT_WIFI_VALUE)

    expect(handleDisconnect).toHaveBeenCalled()
  })

  it('formats the wifi options as <NetworkOptionLabel>s', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    const expectedFoo = shallow(<NetworkOptionLabel {...mockWifiList[0]} />)
    const expectedBar = shallow(<NetworkOptionLabel {...mockWifiList[1]} />)
    const fooLabel = selectField.prop('formatOptionLabel')({ value: 'foo' })
    const barLabel = selectField.prop('formatOptionLabel')({ value: 'bar' })

    expect(shallow(fooLabel)).toEqual(expectedFoo)
    expect(shallow(barLabel)).toEqual(expectedBar)
  })

  it('formats the join other label', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    const label = selectField.prop('formatOptionLabel')({
      value: Constants.JOIN_OTHER_VALUE,
      label: Constants.JOIN_OTHER_LABEL,
    })

    expect(shallow(label).html()).toContain(Constants.JOIN_OTHER_LABEL)
  })

  it('formats the disconnect label', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    const label = selectField.prop('formatOptionLabel')({
      value: Constants.DISCONNECT_WIFI_VALUE,
      label: Constants.DISCONNECT_WIFI_LABEL,
    })

    expect(shallow(label).html()).toContain(Constants.DISCONNECT_WIFI_LABEL)
  })
})
