// @flow
// TODO(mc, 2020-03-20): Popper build misconfigured, but can import types directly
// https://github.com/popperjs/popper-core/issues/1031
import type {
  Instance as PopperInstance,
  Options as PopperOptions,
} from '@popperjs/core/lib/types'

import type { UseHoverOptions, HoverHandlers } from '../interaction-enhancers'

export type Placement = $PropertyType<PopperOptions, 'placement'>

export type Strategy = $PropertyType<PopperOptions, 'strategy'>

export type { PopperInstance, PopperOptions }

export type HandleStateUpdate = (
  placement: Placement,
  styles: {|
    popper?: $Shape<CSSStyleDeclaration>,
    arrow?: $Shape<CSSStyleDeclaration>,
  |}
) => void

export type UsePopperOptions = {|
  target: Element | null,
  tooltip: HTMLElement | null,
  arrow: HTMLElement | null,
  onStateUpdate: HandleStateUpdate,
  placement?: Placement | null,
  strategy?: Strategy | null,
  offset?: number,
|}

export type UsePopperResult = PopperInstance | null

export type UseTooltipOptions = $Shape<{|
  placement?: Placement,
  strategy?: Strategy,
  offset?: number,
|}>

export type UseTooltipResultTargetProps = {|
  ref: (HTMLElement | null) => mixed,
  'aria-describedby': string,
|}

export type UseTooltipResultTooltipProps = {|
  id: string,
  ref: (HTMLElement | null) => mixed,
  placement: Placement | null,
  style: $Shape<CSSStyleDeclaration>,
  arrowRef: (HTMLElement | null) => mixed,
  arrowStyle: $Shape<CSSStyleDeclaration>,
|}

export type UseTooltipResult = [
  UseTooltipResultTargetProps,
  UseTooltipResultTooltipProps
]

export type UseHoverTooltipOptions = $Shape<{|
  ...UseTooltipOptions,
  ...UseHoverOptions,
|}>

export type UseHoverTooltipResult = [
  {| ...UseTooltipResultTargetProps, ...HoverHandlers |},
  {| ...UseTooltipResultTooltipProps, visible: boolean |}
]
