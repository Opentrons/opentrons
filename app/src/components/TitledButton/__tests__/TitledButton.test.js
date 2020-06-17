// @flow

import * as React from 'react'
import { mount } from 'enzyme'

import { TitledButton } from '..'

describe('TitledButton', () => {
  const handleClick = jest.fn()
  const render = () => {
    return mount(
      <TitledButton
        title="Great title"
        description={<span data-test="cool-description" />}
        buttonProps={{ children: 'click me', onClick: handleClick }}
      >
        <span data-test="child" />
      </TitledButton>
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should have a title', () => {
    const wrapper = render()
    expect(wrapper.find('h4').text()).toBe('Great title')
  })

  it('should have a description', () => {
    const wrapper = render()
    expect(wrapper.exists('[data-test="cool-description"]')).toBe(true)
  })

  it('should have a button', () => {
    const wrapper = render()
    const button = wrapper.find('button')

    expect(button.children().html()).toBe('click me')
    button.simulate('click')
    expect(handleClick).toHaveBeenCalled()
  })

  it('should render children', () => {
    const wrapper = render()

    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })
})
