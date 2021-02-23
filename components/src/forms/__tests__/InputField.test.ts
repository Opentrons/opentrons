
import * as React from 'react'
import { mount } from 'enzyme'

import { InputField } from '../InputField'

describe('InputField', () => {
  it('clears out value when isIndeterminate === true', () => {
    const wrapper = mount(
      <InputField onChange={jest.fn()} value="mixed" isIndeterminate />
    )
    const input = wrapper.find('input')
    expect(input.prop('value')).toBe('')
  })

  it('overrides placeholder prop when isIndeterminate === true', () => {
    const wrapper = mount(
      <InputField
        onChange={jest.fn()}
        placeholder="placeholder text"
        isIndeterminate
      />
    )
    const input = wrapper.find('input')
    expect(input.prop('placeholder')).toBe('-')
  })

  it('sets value to an empty string when no value prop present', () => {
    const wrapper = mount(<InputField onChange={jest.fn()} />)
    const input = wrapper.find('input')
    expect(input.prop('value')).toBe('')
  })
})
