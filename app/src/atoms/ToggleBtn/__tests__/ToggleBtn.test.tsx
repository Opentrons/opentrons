import * as React from 'react'
import { shallow } from 'enzyme'

import {
  C_DARK_GRAY,
  C_DISABLED,
  C_SELECTED_DARK,
  Btn,
  Icon,
} from '@opentrons/components'

import { ToggleBtn } from '..'

describe('ToggleBtn', () => {
  it('should be an Icon inside a Btn', () => {
    const wrapper = shallow(<ToggleBtn label="my-toggle" toggledOn={false} />)
    const button = wrapper.find(Btn)
    const icon = button.find(Icon)

    expect(button.prop('role')).toBe('switch')
    expect(button.prop('aria-label')).toBe('my-toggle')
    expect(button.prop('aria-checked')).toBe(false)
    expect(button.prop('color')).toBe(C_DARK_GRAY)
    expect(icon.prop('name')).toBe('ot-toggle-switch-off')
  })

  it('should be a toggle-switch-on icon when toggled on', () => {
    const wrapper = shallow(<ToggleBtn label="my-toggle" toggledOn={true} />)
    const button = wrapper.find(Btn)
    const icon = wrapper.find(Icon)

    expect(button.prop('color')).toBe(C_SELECTED_DARK)
    expect(button.prop('aria-checked')).toBe(true)
    expect(icon.prop('name')).toBe('ot-toggle-switch-on')
  })

  it('should set the color to disabled when disabled', () => {
    const wrapper = shallow(
      <ToggleBtn label="my-toggle" toggledOn={true} disabled />
    )
    const button = wrapper.find(Btn)

    expect(button.prop('color')).toBe(C_DISABLED)
  })

  it('should pass extra props to the Btn', () => {
    const handleClick = jest.fn()
    const wrapper = shallow(
      <ToggleBtn
        label="my-toggle"
        toggledOn={true}
        onClick={handleClick}
        size="100%"
      />
    )
    const button = wrapper.find(Btn)

    expect(button.prop('onClick')).toBe(handleClick)
    expect(button.prop('size')).toBe('100%')
  })
})
