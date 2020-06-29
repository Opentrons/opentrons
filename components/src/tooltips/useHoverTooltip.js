// @flow

import { useHover } from '../interaction-enhancers'
import type { UseHoverTooltipOptions, UseHoverTooltipResult } from './types'
import { useTooltip } from './useTooltip'

const ENTER_DELAY_MS = 300
const LEAVE_DELAY_MS = 0

/**
 * Hook to position a tooltip component relative to a target component on hover.
 * Adds a default `enterDelay` of 300 ms before the tooltip will show
 *
 * @param {UseHoverTooltipOptions} [options={}] (change default options (see `useTooltip` and `useHover`))
 * @returns {UseHoverTooltipResult}
 * @example
 * ```js
 * import { useHoverTooltip, Tooltip } from '@opentrons/components'
 *
 * export function HelloWorld() {
 *   const [targetProps, tooltipProps] = useHoverTooltip()
 *
 *   return (
 *     <>
 *       <span {...targetProps}>Hello</span>
 *       <Tooltip {...tooltipProps}>World</Tooltip>
 *     </>
 *   )
 * }
 * ```
 */
export function useHoverTooltip(
  options: UseHoverTooltipOptions = {}
): UseHoverTooltipResult {
  const {
    enterDelay = ENTER_DELAY_MS,
    leaveDelay = LEAVE_DELAY_MS,
    ...useTooltipOptions
  } = options

  const [targetProps, tooltipProps] = useTooltip(useTooltipOptions)
  const [visible, hoverHandlers] = useHover({ enterDelay, leaveDelay })

  return [{ ...targetProps, ...hoverHandlers }, { ...tooltipProps, visible }]
}
