// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { usePopper } from '../usePopper'
import * as Types from '../types'
import * as Constants from '../constants'

const onStateUpdate = jest.fn()

describe('usePopper hook', () => {
  let result: null | Types.UsePopperResult = null

  const render = (options: Types.UsePopperOptions) => {
    const TestUsePopper = (props: Types.UsePopperOptions) => {
      result = usePopper(props)
      return null
    }

    // render and then immediately re-render to run effects
    const wrapper = mount(<TestUsePopper {...options} />)
    wrapper.setProps({})

    return wrapper
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('takes refs for target, tooltip, and arrow and returns a Popper instance', () => {
    const target = document.createElement('div')
    const tooltip = document.createElement('div')
    const arrow = document.createElement('div')

    // arrow node must be a child of the tooltip node
    tooltip.appendChild(arrow)

    render({ target, tooltip, arrow, onStateUpdate })

    expect(result?.state.elements.reference).toBe(target)
    expect(result?.state.elements.popper).toBe(tooltip)
    expect(result?.state.elements.arrow).toBe(arrow)
  })

  // slightly non-sensical case, but important for safety
  it('returns null if target is not rendered', () => {
    const target = null
    const tooltip = document.createElement('div')
    const arrow = document.createElement('div')

    // arrow node must be a child of the tooltip node
    tooltip.appendChild(arrow)

    render({ target, tooltip, arrow, onStateUpdate })

    expect(result).toBe(null)
  })

  it('returns null if tooltip is not rendered', () => {
    const target = document.createElement('div')
    const tooltip = null
    const arrow = null

    render({ target, tooltip, arrow, onStateUpdate })

    expect(result).toBe(null)
  })

  it('handles no arrow rendered', () => {
    const target = document.createElement('div')
    const tooltip = document.createElement('div')
    const arrow = null

    render({ target, tooltip, arrow, onStateUpdate })

    expect(result?.state.elements.reference).toBe(target)
    expect(result?.state.elements.popper).toBe(tooltip)
    expect(result?.state.elements.arrow).toBe(undefined)
  })

  it("returns the same Popper instance render-to-render if nodes don't change", () => {
    const target = document.createElement('div')
    const tooltip = document.createElement('div')
    const arrow = null

    const wrapper = render({ target, tooltip, arrow, onStateUpdate })
    const prevResult = result

    // force re-render
    wrapper.setProps({})

    // NOTE(mc, 2020-03-20): expect(prevResult).toBe(result) prints a confusing
    // assertion failure, see https://jestjs.io/docs/en/expect#tobevalue
    expect(Object.is(prevResult, result)).toBe(true)
  })

  it('destroys previous Popper instance if nodes change', () => {
    const target = document.createElement('div')
    const tooltip = document.createElement('div')
    const arrow = null

    const wrapper = render({ target, tooltip, arrow, onStateUpdate })
    const prevResult = result
    const destroy = jest.spyOn(prevResult, 'destroy')

    // force re-render with tooltip no longer rendered
    // re-render again to propagate effects
    wrapper.setProps({ tooltip: null })
    wrapper.setProps({})

    expect(result).toBe(null)
    expect(destroy).toHaveBeenCalled()
  })

  it('can pass placement / strategy options into popper', () => {
    const target = document.createElement('div')
    const tooltip = document.createElement('div')
    const arrow = null

    render({
      target,
      tooltip,
      arrow,
      onStateUpdate,
      placement: Constants.TOOLTIP_TOP,
      strategy: Constants.TOOLTIP_FIXED,
    })

    expect(result?.state.options.placement).toEqual('top')
    expect(result?.state.options.strategy).toEqual('fixed')
  })

  it("disables popper's default applyStyle modifier", () => {
    const target = document.createElement('div')
    const tooltip = document.createElement('div')
    const arrow = null

    render({ target, tooltip, arrow, onStateUpdate, placement: 'right' })

    expect(result?.state.orderedModifiers).not.toContainEqual(
      expect.objectContaining({
        name: 'applyStyle',
      })
    )
  })

  it('adds a modifier that calls onUpdateState', () => {
    const target = document.createElement('div')
    const tooltip = document.createElement('div')
    const arrow = null

    render({ target, tooltip, arrow, onStateUpdate, placement: 'right' })

    // test that state is set immediately
    expect(onStateUpdate).toHaveBeenCalledWith(
      'right',
      expect.objectContaining({
        popper: expect.objectContaining({ position: 'absolute' }),
        arrow: expect.objectContaining({ position: 'absolute' }),
      })
    )
  })

  it('can set the offset modifier', () => {
    const target = document.createElement('div')
    const tooltip = document.createElement('div')
    const arrow = null
    const offset = 16

    render({ target, tooltip, arrow, onStateUpdate, offset })

    expect(result?.state.orderedModifiers).toContainEqual(
      expect.objectContaining({
        name: 'offset',
        options: { offset: [0, 16] },
      })
    )
  })
})
