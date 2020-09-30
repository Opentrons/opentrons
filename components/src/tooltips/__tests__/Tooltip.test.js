// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import { TOOLTIP_TOP } from '../constants'
import { Tooltip, Arrow } from '../Tooltip'

const placement = TOOLTIP_TOP
const tooltipId = 'tooltip-id'
const tooltipRef = jest.fn()
const tooltipStyle = { position: 'absolute', left: '2px' }
const arrowRef = jest.fn()
const arrowStyle = { position: 'absolute', left: '8px' }

const TOOLTIP_SELECTOR = 'div[role="tooltip"]'

const render = (visible = true, children = <></>) => {
  // NOTE(mc): redundant fragement necessary for enzyme issue with forwardRef
  // https://github.com/enzymejs/enzyme/issues/1852
  return mount(
    <>
      <Tooltip
        {...{
          visible,
          placement,
          id: tooltipId,
          ref: tooltipRef,
          style: tooltipStyle,
          arrowRef,
          arrowStyle,
        }}
      >
        {children}
      </Tooltip>
    </>
  )
}

describe('hook-based Tooltip', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders nothing when visible: false', () => {
    const wrapper = render(false)

    expect(wrapper.html()).toBe(null)
  })

  it('renders something with role="tooltip", id, and children when visible', () => {
    const wrapper = render(true, 'hello world')
    const tooltip = wrapper.find(TOOLTIP_SELECTOR)

    expect(tooltip.prop('id')).toBe(tooltipId)
    expect(tooltip.html()).toContain('hello world')
  })

  // NOTE(mc): this test fails if redundant fragment in `render` is removed
  it('attaches the tooltip ref to the tooltip', () => {
    const wrapper = render(true)
    const tooltip = wrapper.find(TOOLTIP_SELECTOR)
    const refResult = tooltipRef.mock.calls[0][0]

    expect(refResult).toEqual(tooltip.getDOMNode())
  })

  it('attaches styles to the tooltip', () => {
    const wrapper = render(true)
    const tooltip = wrapper.find(TOOLTIP_SELECTOR)
    const style = tooltip.getDOMNode().style
    expect(style.getPropertyValue('position')).toEqual(tooltipStyle.position)
    expect(style.getPropertyValue('left')).toEqual(tooltipStyle.left)
  })

  it('attaches an arrow ref to the arrow', () => {
    const wrapper = render(true)
    const arrow = wrapper.find(Arrow)
    const refResult = arrowRef.mock.calls[0][0]

    expect(refResult).toEqual(arrow.getDOMNode())
  })

  it('attaches styles to the arrow', () => {
    const wrapper = render(true)
    const arrow = wrapper.find(Arrow)
    const style = arrow.getDOMNode().style
    expect(style.getPropertyValue('position')).toEqual(arrowStyle.position)
    expect(style.getPropertyValue('left')).toEqual(arrowStyle.left)
  })

  it('passes placement to the arrow', () => {
    const wrapper = render(true)
    const arrow = wrapper.find(Arrow)

    expect(arrow.prop('placement')).toEqual(placement)
  })
})
