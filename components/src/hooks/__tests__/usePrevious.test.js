// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { usePrevious } from '..'

describe('usePrevious hook', () => {
  const TestUsePrevious = (props: { value: string }) => {
    const prevValue = usePrevious(props.value)
    return (
      <span>{typeof prevValue === 'undefined' ? 'undefined' : prevValue}</span>
    )
  }

  it('initial previous value is `undefined', () => {
    const wrapper = mount(<TestUsePrevious value="foo" />)
    expect(wrapper.html()).toEqual('<span>undefined</span>')
  })

  it('saves previous values', () => {
    const wrapper = mount(<TestUsePrevious value="foo" />)
    wrapper.setProps({ value: 'bar' })
    expect(wrapper.html()).toEqual('<span>foo</span>')
    wrapper.setProps({ value: 'baz' })
    expect(wrapper.html()).toEqual('<span>bar</span>')
    wrapper.setProps({ value: 'qux' })
    expect(wrapper.html()).toEqual('<span>baz</span>')
  })
})
