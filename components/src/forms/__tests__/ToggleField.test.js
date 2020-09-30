// @flow
import * as React from 'react'
import { shallow, mount } from 'enzyme'

import { ToggleField } from '../ToggleField'
import { Icon } from '../../icons'

describe('ToggleField', () => {
  it('renders an Icon', () => {
    const wrapper = shallow(
      <ToggleField
        offLabel="Toggled Off"
        onLabel="Toggled On"
        onChange={jest.fn()}
        value={true}
      />
    )

    expect(wrapper.find(Icon)).toHaveLength(1)
  })

  it('renders label conditional labels', () => {
    const labelOnText = 'Toggled On'
    const labelOffText = 'Toggled Off'

    const wrapperOn = mount(
      <ToggleField
        offLabel={labelOffText}
        onLabel={labelOnText}
        onChange={jest.fn()}
        value={true}
      />
    )

    const wrapperOff = mount(
      <ToggleField
        offLabel={labelOffText}
        onLabel={labelOnText}
        onChange={jest.fn()}
        value={false}
      />
    )

    expect(wrapperOn.text()).toEqual(labelOnText)
    expect(wrapperOff.text()).toEqual(labelOffText)
  })

  it('passes disabled prop', () => {
    const wrapper = mount(
      <ToggleField
        offLabel="off"
        onLabel="on"
        onChange={jest.fn()}
        value={false}
        disabled
      />
    )

    expect(wrapper.props().disabled).toEqual(true)
  })
})
