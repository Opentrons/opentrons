import * as React from 'react'
import { mount } from 'enzyme'
import { CONTEXT_VALUE, CONTEXT_MENU } from '@opentrons/components'

import { SelectField } from '../../../../../../atoms/SelectField'
import * as Fixtures from '../../../../../../redux/networking/__fixtures__'
import { LABEL_JOIN_OTHER_NETWORK } from '../../i18n'

import { SelectSsid } from '..'
import { NetworkOptionLabel } from '../NetworkOptionLabel'

import type { ActionMeta } from 'react-select'
import type { SelectOption } from '../../../../../../atoms/SelectField/Select'

const mockWifiList = [
  { ...Fixtures.mockWifiNetwork, ssid: 'foo', active: true },
  { ...Fixtures.mockWifiNetwork, ssid: 'bar' },
  { ...Fixtures.mockWifiNetwork, ssid: 'baz' },
]

describe('SelectSsid component', () => {
  const handleConnect = jest.fn()
  const handleJoinOther = jest.fn()
  let mockIsRobotBusy = false

  const render = () => {
    return mount(
      <SelectSsid
        list={mockWifiList}
        value={null}
        onConnect={handleConnect}
        onJoinOther={handleJoinOther}
        isRobotBusy={mockIsRobotBusy}
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

  it('renders a disabled SelectField if a robot is busy', () => {
    mockIsRobotBusy = true
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    expect(selectField.prop('disabled')).toBe(true)
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
          value: expect.any(String),
          label: LABEL_JOIN_OTHER_NETWORK,
        },
      ],
    })
  })

  it('if user selects ssid value, onSelect is called with ssid', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    selectField.invoke('onValueChange')?.(
      '_',
      'foo',
      ('input-change' as unknown) as ActionMeta<SelectOption>
    )

    expect(handleConnect).toHaveBeenCalledWith('foo')
  })

  it('if user selects join other value, onJoinOther is called', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)
    const options = selectField.prop('options').flatMap((o: any) => o.options)
    const joinOtherValue = options.find(
      o => o.label === LABEL_JOIN_OTHER_NETWORK
    )?.value

    expect(joinOtherValue).toEqual(expect.any(String))
    selectField.invoke('onValueChange')?.(
      '_',
      joinOtherValue,
      ('input-change' as unknown) as ActionMeta<SelectOption>
    )

    expect(handleJoinOther).toHaveBeenCalled()
  })

  it('formats the wifi options as <NetworkOptionLabel>s', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)

    const expectedFoo = mount(
      <NetworkOptionLabel {...mockWifiList[0]} showConnectedIcon={false} />
    )
    const expectedBar = mount(
      <NetworkOptionLabel {...mockWifiList[1]} showConnectedIcon={true} />
    )
    const fooLabel = selectField.prop('formatOptionLabel')?.({ value: 'foo' }, {
      context: CONTEXT_VALUE,
    } as any) as any
    const barLabel = selectField.prop('formatOptionLabel')?.({ value: 'bar' }, {
      context: CONTEXT_MENU,
    } as any) as any

    expect(mount(fooLabel)).toEqual(expectedFoo)
    expect(mount(barLabel)).toEqual(expectedBar)
  })

  it('formats the join other label', () => {
    const wrapper = render()
    const selectField = wrapper.find(SelectField)
    const options = selectField.prop('options').flatMap((o: any) => o.options)
    const joinOtherOpt = options.find(o => o.label === LABEL_JOIN_OTHER_NETWORK)

    expect(joinOtherOpt?.value).toEqual(expect.any(String))
    expect(joinOtherOpt?.label).toEqual(expect.any(String))

    const label = selectField.prop('formatOptionLabel')?.(joinOtherOpt, {
      context: CONTEXT_MENU,
    } as any) as any

    expect(mount(label).html()).toContain(joinOtherOpt?.label)
  })
})
