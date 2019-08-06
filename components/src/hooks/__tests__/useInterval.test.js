// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { useInterval } from '..'

describe('usePrevious hook', () => {
  const callback = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  const TestUseInterval = (props: { delay: number | null }) => {
    useInterval(callback, props.delay)
    return <span />
  }

  test('delay `null` results in no calls', () => {
    mount(<TestUseInterval delay={null} />)
    jest.runTimersToTime(10000)

    expect(callback).toHaveBeenCalledTimes(0)
  })

  test('delay sets an interval', () => {
    mount(<TestUseInterval delay={2} />)
    jest.runTimersToTime(10)

    expect(callback).toHaveBeenCalledTimes(5)
  })

  test('re-rendering with delay={null} clears the interval', () => {
    const wrapper = mount(<TestUseInterval delay={2} />)

    jest.runTimersToTime(6)
    wrapper.setProps({ delay: null })
    jest.runTimersToTime(4)

    expect(callback).toHaveBeenCalledTimes(3)
  })
})
