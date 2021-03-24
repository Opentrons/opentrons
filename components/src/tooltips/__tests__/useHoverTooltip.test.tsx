import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'

import { TOOLTIP_TOP, TOOLTIP_FIXED } from '../constants'
import * as UseTooltip from '../useTooltip'
import { Tooltip } from '../Tooltip'
import { useHoverTooltip } from '../useHoverTooltip'

import type { ReactWrapper } from 'enzyme'
import * as Types from '../types'

jest.mock('../useTooltip', () => ({
  useTooltip: jest.fn(jest.requireActual('../useTooltip').useTooltip),
}))

const useTooltip = UseTooltip.useTooltip as jest.MockedFunction<
  typeof UseTooltip.useTooltip
>

const TestUseHoverTooltip = (
  props: Types.UseHoverTooltipOptions
): JSX.Element => {
  const [targetProps, tooltipProps] = useHoverTooltip(props)

  return (
    <>
      <div {...targetProps} data-test="target">
        Target!
      </div>
      <Tooltip {...tooltipProps}>Tooltip!</Tooltip>
    </>
  )
}

const render = (
  props: Types.UseHoverTooltipOptions = {}
): ReactWrapper<Types.UseHoverTooltipOptions> => {
  return mount(<TestUseHoverTooltip {...props} />)
}

describe('useHoverTooltip', () => {
  afterEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('returns useTooltip props', () => {
    const wrapper = render()
    const target = wrapper.find('[data-test="target"]')
    const tooltip = wrapper.find(Tooltip)

    const [targetProps, tooltipProps] = useTooltip.mock.results[0].value

    // NOTE(mc): refs are a little convoluted to test, but if the refs
    // don't work it'll be _very_ obvious so I think we're safe
    const { ref: targetRef, ...otherTargetProps } = targetProps
    const { ref: tooltipRef, ...otherTooltipProps } = tooltipProps

    expect(target.props()).toMatchObject(otherTargetProps)
    expect(tooltip.props()).toMatchObject(otherTooltipProps)
  })

  it('attaches onPointerEnter handler to target props with enter delay', () => {
    jest.useFakeTimers()

    const wrapper = render()
    const target = wrapper.find('[data-test="target"]')

    act(() => {
      target.invoke('onPointerEnter')?.({} as any)
    })
    wrapper.update()

    expect(wrapper.find(Tooltip).prop('visible')).toBe(false)

    act(() => {
      jest.advanceTimersByTime(300)
    })
    wrapper.update()

    expect(wrapper.find(Tooltip).prop('visible')).toBe(true)

    // cleanup to avoid react complaints
    wrapper.unmount()
  })

  it('attaches onPointerLeave handler to target props without leave delay', () => {
    jest.useFakeTimers()

    const wrapper = render()
    const target = wrapper.find('[data-test="target"]')

    act(() => {
      target.invoke('onPointerEnter')?.({} as any)
      jest.runTimersToTime(300)
      target.invoke('onPointerLeave')?.({} as any)
    })
    wrapper.update()

    expect(wrapper.find(Tooltip).prop('visible')).toBe(false)

    // cleanup to avoid react complaints
    wrapper.unmount()
  })

  it('can take an enter delay', () => {
    jest.useFakeTimers()

    const wrapper = render({ enterDelay: 500 })
    const target = wrapper.find('[data-test="target"]')

    act(() => {
      target.invoke('onPointerEnter')?.({} as any)
      jest.runTimersToTime(300)
    })
    wrapper.update()

    expect(wrapper.find(Tooltip).prop('visible')).toBe(false)

    act(() => {
      jest.advanceTimersByTime(200)
    })
    wrapper.update()

    expect(wrapper.find(Tooltip).prop('visible')).toBe(true)

    // cleanup to avoid react complaints
    wrapper.unmount()
  })

  it('can take an leave delay', () => {
    jest.useFakeTimers()

    const wrapper = render({ enterDelay: 0, leaveDelay: 500 })
    const target = wrapper.find('[data-test="target"]')

    act(() => {
      target.invoke('onPointerEnter')?.({} as any)
      target.invoke('onPointerLeave')?.({} as any)
    })
    wrapper.update()

    expect(wrapper.find(Tooltip).prop('visible')).toBe(true)

    act(() => {
      jest.advanceTimersByTime(500)
    })
    wrapper.update()

    expect(wrapper.find(Tooltip).prop('visible')).toBe(false)

    // cleanup to avoid react complaints
    wrapper.unmount()
  })

  it('passes tooltip options to useTooltip', () => {
    const options = {
      placement: TOOLTIP_TOP,
      strategy: TOOLTIP_FIXED,
      offset: 42,
    }
    render(options)

    expect(useTooltip).toHaveBeenCalledWith(options)
  })
})
