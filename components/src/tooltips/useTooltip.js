// @flow
import { useState, useCallback, useRef } from 'react'
import uniqueId from 'lodash/uniqueId'
import { usePopper } from './usePopper'
import * as Styles from './styles'

import type { UseTooltipOptions, UseTooltipResult, Placement } from './types'

type TooltipState = {|
  placement: Placement | null,
  tooltipStyle: $Shape<CSSStyleDeclaration>,
  arrowStyle: $Shape<CSSStyleDeclaration>,
|}

const TOOLTIP_ID_PREFIX = 'Tooltip__'

/**
 * Hook to position a tooltip component relative to a target component
 *
 * @param {UseTooltipOptions} [options={}] (change the default `position`, `strategy`, or `offset` of the tooltip)
 * @returns {UseTooltipResult}
 * @example
 * ```js
 * import {
 *   useTooltip,
 *   Tooltip,
 *   TOOLTIP_TOP,
 *   TOOLTIP_FIXED
 * } from '@opentrons/components'
 *
 * export function HelloWorld() {
 *   const [targetProps, tooltipProps] = useTooltip({
 *     position: TOOLTIP_TOP,
 *     strategy: TOOLTIP_FIXED
 *   })
 *
 *   return (
 *     <>
 *       <span {...targetProps}>Hello</span>
 *       <Tooltip visible={true} {...tooltipProps}>World</Tooltip>
 *     </>
 *   )
 * }
 * ```
 */
export function useTooltip(options: UseTooltipOptions = {}): UseTooltipResult {
  const { placement, strategy, offset = Styles.TOOLTIP_OFFSET_PX } = options
  const tooltipId = useRef(uniqueId(TOOLTIP_ID_PREFIX)).current
  const [target, targetRef] = useState<Element | null>(null)
  const [tooltip, tooltipRef] = useState<HTMLElement | null>(null)
  const [arrow, arrowRef] = useState<HTMLElement | null>(null)
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    placement: null,
    tooltipStyle: Styles.INITIAL_TOOLTIP_STYLE,
    arrowStyle: Styles.INITIAL_ARROW_STYLE,
  })

  const onStateUpdate = useCallback((placement, styles) => {
    setTooltipState({
      placement,
      tooltipStyle: styles.popper ?? Styles.INITIAL_TOOLTIP_STYLE,
      arrowStyle: styles.arrow ?? Styles.INITIAL_ARROW_STYLE,
    })
  }, [])

  usePopper({
    target,
    tooltip,
    arrow,
    placement,
    strategy,
    offset,
    onStateUpdate,
  })

  const targetProps = {
    ref: targetRef,
    'aria-describedby': tooltipId,
  }

  const tooltipProps = {
    id: tooltipId,
    ref: tooltipRef,
    style: tooltipState.tooltipStyle,
    arrowStyle: tooltipState.arrowStyle,
    placement: tooltipState.placement,
    arrowRef,
  }

  return [targetProps, tooltipProps]
}
