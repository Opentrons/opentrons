// @flow
import { mount } from 'enzyme'
import * as React from 'react'

import { useTimeout } from '..'

describe('useTimeouthook', () => {
  const callback = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  const TestUseTimeout = (props: { delay: number | null }) => {
    useTimeout(callback, props.delay)
    return <span />
  }

  it('delay `null` results in no calls', () => {
    mount(<TestUseTimeout delay={null} />)
    jest.runTimersToTime(10000)

    expect(callback).toHaveBeenCalledTimes(0)
  })

  it('delay sets a timeout', () => {
    mount(<TestUseTimeout delay={2} />)
    jest.runTimersToTime(3)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('re-rendering with delay={null} clears the interval', () => {
    const wrapper = mount(<TestUseTimeout delay={4} />)

    jest.runTimersToTime(2)
    wrapper.setProps({ delay: null })

    expect(callback).toHaveBeenCalledTimes(0)

    wrapper.setProps({ delay: 4 })
    jest.runTimersToTime(6)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})
