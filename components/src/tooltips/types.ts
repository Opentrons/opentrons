import type { CSSProperties } from 'react'

import type {
  Instance as PopperInstance,
  Options as PopperOptions,
  Modifier as PopperModifer,
} from '@popperjs/core'

import type { UseHoverOptions, HoverHandlers } from '../interaction-enhancers'

export type Placement = PopperOptions['placement']

export type Strategy = PopperOptions['strategy']

export type { PopperInstance, PopperOptions, PopperModifer }

export type HandleStateUpdate = (
  placement: Placement,
  styles: {
    popper?: CSSProperties
    arrow?: CSSProperties
  }
) => void

export interface UsePopperOptions {
  target: Element | null
  tooltip: HTMLElement | null
  arrow: HTMLElement | null
  onStateUpdate: HandleStateUpdate
  placement?: Placement | null
  strategy?: Strategy | null
  offset?: number
}

export type UsePopperResult = PopperInstance | null

export interface UseTooltipOptions {
  placement?: Placement
  strategy?: Strategy
  offset?: number
}

export interface UseTooltipResultTargetProps {
  ref: React.RefCallback<HTMLElement | null>
  'aria-describedby': string
}

export interface UseTooltipResultTooltipProps {
  id: string
  ref: React.RefCallback<HTMLElement | null>
  placement: Placement | null
  style: CSSProperties
  arrowRef: React.RefCallback<HTMLElement | null>
  arrowStyle: CSSProperties
}

export type UseTooltipResult = [
  UseTooltipResultTargetProps,
  UseTooltipResultTooltipProps
]

export type UseHoverTooltipOptions = Partial<
  UseTooltipOptions & UseHoverOptions
>

export type UseHoverTooltipTargetProps = UseTooltipResultTargetProps &
  HoverHandlers

export type UseHoverTooltipResult = [
  UseHoverTooltipTargetProps,
  UseTooltipResultTooltipProps & { visible: boolean }
]
