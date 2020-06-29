// @flow
import { mount } from 'enzyme'
import * as React from 'react'
import { act } from 'react-dom/test-utils'

import type { UseHoverOptions, UseHoverResult } from '../useHover'
import { useHover } from '../useHover'

const TARGET_SELECTOR = '[data-test="target"]'

describe('useHover hook', () => {
  let result: UseHoverResult

  const TestUseHover = (options: UseHoverOptions) => {
    result = useHover(options)
    return <div data-test="target" {...result[1]} />
  }

  const render = (options?: UseHoverOptions) => {
    return mount(<TestUseHover {...options} />)
  }

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('returns not hovered by default', () => {
    render()
    const [hovered] = result
    expect(hovered).toBe(false)
  })

  it('sets hovered on component mouse enter', () => {
    const wrapper = render()
    const target = wrapper.find(TARGET_SELECTOR)

    act(() => {
      target.simulate('pointerEnter')
    })

    expect(result[0]).toBe(true)
  })

  it('unsets hovered on component mouse leave', () => {
    const wrapper = render()
    const target = wrapper.find(TARGET_SELECTOR)

    act(() => {
      target.simulate('pointerEnter')
    })

    act(() => {
      target.simulate('pointerLeave')
    })

    expect(result[0]).toBe(false)
  })

  it('can take an enter delay option', () => {
    jest.useFakeTimers()

    const wrapper = render({ enterDelay: 42 })
    const target = wrapper.find(TARGET_SELECTOR)

    act(() => {
      target.simulate('pointerEnter')
    })

    expect(result[0]).toBe(false)

    act(() => {
      jest.advanceTimersByTime(42)
    })

    expect(result[0]).toBe(true)
  })

  it('cancels enter delay on leave', () => {
    jest.useFakeTimers()

    const wrapper = render({ enterDelay: 42 })
    const target = wrapper.find(TARGET_SELECTOR)

    act(() => {
      target.simulate('pointerEnter')
      target.simulate('pointerLeave')
      jest.advanceTimersByTime(42)
    })

    expect(result[0]).toBe(false)
  })

  it('can take a leave delay option', () => {
    jest.useFakeTimers()

    const wrapper = render({ leaveDelay: 42 })
    const target = wrapper.find(TARGET_SELECTOR)

    act(() => {
      target.simulate('pointerEnter')
      target.simulate('pointerLeave')
    })

    expect(result[0]).toBe(true)

    act(() => {
      jest.advanceTimersByTime(42)
    })

    expect(result[0]).toBe(false)
  })

  it('cancels a leave delay on enter', () => {
    jest.useFakeTimers()

    const wrapper = render({ leaveDelay: 42 })
    const target = wrapper.find(TARGET_SELECTOR)

    act(() => {
      target.simulate('pointerEnter')
      target.simulate('pointerLeave')
      target.simulate('pointerEnter')
      jest.advanceTimersByTime(42)
    })

    act(() => {
      jest.advanceTimersByTime(42)
    })

    expect(result[0]).toBe(true)
  })

  it('cleans up its timeouts', () => {
    jest.useFakeTimers()

    const wrapper = render({ enterDelay: 42 })
    const target = wrapper.find(TARGET_SELECTOR)

    act(() => {
      target.simulate('pointerEnter')
      wrapper.unmount()
      jest.advanceTimersByTime(0)
    })

    expect(jest.getTimerCount()).toBe(0)
  })
})
