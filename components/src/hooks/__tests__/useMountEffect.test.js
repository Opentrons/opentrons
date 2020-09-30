// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { useMountEffect } from '../useMountEffect'

describe('useMountEffect hook', () => {
  const TestUseMountEffect = (props: {|
    onMount: () => void | (() => void),
  |}) => {
    useMountEffect(props.onMount)
    return <></>
  }
  const render = handleMount => {
    return mount(<TestUseMountEffect onMount={handleMount} />)
  }

  it('should call mount handler on render', () => {
    const handleMount = jest.fn()

    render(handleMount)
    expect(handleMount).toHaveBeenCalledTimes(1)
  })

  it('should not call mount handler again on subsequent renders', () => {
    const handleMount = jest.fn()
    const wrapper = render(handleMount)

    wrapper.setProps({})
    expect(handleMount).toHaveBeenCalledTimes(1)
  })

  it('should not call mount handler again if handler changes', () => {
    const handleMount = jest.fn()
    const handleMountDifferently = jest.fn()
    const wrapper = render(handleMount)

    wrapper.setProps({ onMount: handleMountDifferently })
    expect(handleMount).toHaveBeenCalledTimes(1)
    expect(handleMountDifferently).toHaveBeenCalledTimes(0)
  })

  it('should run a cleanup function', () => {
    const handleUnmount = jest.fn()
    const handleMount = () => handleUnmount
    const wrapper = render(handleMount)

    expect(handleUnmount).toHaveBeenCalledTimes(0)
    wrapper.unmount()
    expect(handleUnmount).toHaveBeenCalledTimes(1)
  })
})
