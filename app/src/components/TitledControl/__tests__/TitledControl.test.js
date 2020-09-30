// @flow

import * as React from 'react'
import { mount } from 'enzyme'

import { TitledControl } from '..'

describe('TitledControl', () => {
  const render = () => {
    return mount(
      <TitledControl
        title="Great title"
        description={<span data-test="cool-description" />}
        control={<button data-test="control" />}
      >
        <span data-test="child" />
      </TitledControl>
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
    expect(wrapper.exists('[data-test="control"]')).toBe(true)
  })

  it('should render children', () => {
    const wrapper = render()

    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })
})
