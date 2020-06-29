// @flow
import { mount } from 'enzyme'
import * as React from 'react'
import { act } from 'react-dom/test-utils'

import { Arrow, Tooltip } from '../Tooltip'
import * as Types from '../types'
import * as UsePopper from '../usePopper'
import { useTooltip } from '../useTooltip'

// mocking out usePopper because it calls stuff async and that makes
// react complain about wrapping stuff in `act`, which we can't
jest.mock('../usePopper')

const usePopper: JestMockFn<[Types.UsePopperOptions], Types.UsePopperResult> =
  UsePopper.usePopper

type TestUseTooltipProps = {|
  ...Types.UseTooltipOptions,
  visible: boolean,
|}

describe('useTooltip hook', () => {
  const render = (options: TestUseTooltipProps) => {
    const TestUseTooltip = (props: TestUseTooltipProps) => {
      const { visible, ...hookOptions } = props
      const [targetProps, tooltipProps] = useTooltip(hookOptions)

      return (
        <>
          <div {...targetProps} data-test="target">
            Target!
          </div>
          <Tooltip visible={props.visible} {...tooltipProps}>
            Tooltip!
          </Tooltip>
        </>
      )
    }

    // render and then immediately re-render to run effects
    const wrapper = mount(<TestUseTooltip {...options} />)
    wrapper.setProps({})

    return wrapper
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('can take placement, strategy, and offset options to pass to popper', () => {
    render({
      visible: true,
      placement: 'top-start',
      strategy: 'fixed',
      offset: 42,
    })

    expect(usePopper).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: 'top-start',
        strategy: 'fixed',
        offset: 42,
      })
    )
  })

  it('applies a default offset of 0.5rem if omitted', () => {
    render({ visible: true })

    expect(usePopper).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 8,
      })
    )
  })

  it('returns refs that pass elements to usePopper', () => {
    const wrapper = render({ visible: true })
    const target = wrapper.find('[data-test="target"]').getDOMNode()
    const tooltip = wrapper.find(Tooltip).getDOMNode()
    const arrow = wrapper.find(Arrow).getDOMNode()

    expect(usePopper).toHaveBeenCalledWith(
      expect.objectContaining({ target, tooltip, arrow })
    )
  })

  it('updates tooltip placement and style state from Popper', () => {
    const wrapper = render({ visible: true })
    const handleStateUpdate = usePopper.mock.calls[0][0].onStateUpdate

    act(() => {
      handleStateUpdate('top-end', {
        popper: { position: 'absolute', left: '42px' },
        arrow: { position: 'absolute', left: '21px' },
      })
    })
    wrapper.update()
    const tooltip = wrapper.find(Tooltip)

    expect(tooltip.prop('placement')).toEqual('top-end')
    expect(tooltip.prop('style')).toEqual({
      position: 'absolute',
      left: '42px',
    })
    expect(tooltip.prop('arrowStyle')).toEqual({
      position: 'absolute',
      left: '21px',
    })
  })

  it('generates a unique tooltipId', () => {
    const tooltip1 = render({ visible: true }).find(Tooltip)
    const tooltip2 = render({ visible: true }).find(Tooltip)

    expect(tooltip1.prop('id')).toEqual(expect.any(String))
    expect(tooltip2.prop('id')).toEqual(expect.any(String))
    expect(tooltip1.prop('id')).not.toEqual(tooltip2.prop('id'))
  })
})
