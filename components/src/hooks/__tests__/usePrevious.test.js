// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { usePrevious } from '..'

describe('usePrevious hook', () => {
  const UsePreviousTester = (props: { value: string }) => {
    const prevValue = usePrevious(props.value)
    return (
      <span>{typeof prevValue === 'undefined' ? 'undefined' : prevValue}</span>
    )
  }

  test('initial previous value is `undefined', () => {
    const wrapper = mount(<UsePreviousTester value="foo" />)
    expect(wrapper.html()).toEqual('<span>undefined</span>')
  })

  test('saves previous values', () => {
    const wrapper = mount(<UsePreviousTester value="foo" />)
    wrapper.setProps({ value: 'bar' })
    expect(wrapper.html()).toEqual('<span>foo</span>')
    wrapper.setProps({ value: 'baz' })
    expect(wrapper.html()).toEqual('<span>bar</span>')
    wrapper.setProps({ value: 'qux' })
    expect(wrapper.html()).toEqual('<span>baz</span>')
  })
})
