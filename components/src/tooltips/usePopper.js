// @flow
import { useRef, useLayoutEffect } from 'react'
import { createPopper } from '@popperjs/core'

import type {
  UsePopperOptions,
  UsePopperResult,
  PopperOptions,
  HandleStateUpdate,
} from './types'

const DISABLED_APPLY_STYLES_MODIFIER = {
  name: 'applyStyles',
  enabled: false,
}

const makeUpdateStateModifier = (handleStateUpdate: HandleStateUpdate) => ({
  name: 'updateUsePopperState',
  enabled: true,
  phase: 'write',
  fn: ({ state }) => {
    console.log('applyStyles', state)
    handleStateUpdate(state.placement, state.styles)
  },
})

const makeOffsetModifier = (offset: number) => ({
  name: 'offset',
  options: { offset: [0, offset] },
})

const makeArrowModifier = (arrow: Element) => ({
  name: 'arrow',
  options: { element: arrow },
})

export function usePopper(options: UsePopperOptions): UsePopperResult {
  const {
    target,
    tooltip,
    arrow,
    placement,
    strategy,
    offset,
    onStateUpdate,
  } = options

  const popperRef = useRef<UsePopperResult | null>(null)

  // useLayoutEffect instead of useEffect to avoid positioning flash
  useLayoutEffect(() => {
    if (target && tooltip) {
      const options: $Shape<PopperOptions> = {
        modifiers: [
          DISABLED_APPLY_STYLES_MODIFIER,
          makeUpdateStateModifier(onStateUpdate),
        ],
      }

      if (offset != null) {
        options.modifiers.push(makeOffsetModifier(offset))
      }

      if (arrow) {
        options.modifiers.push(makeArrowModifier(arrow))
      }

      if (placement != null) options.placement = placement
      if (strategy != null) options.strategy = strategy

      const popperInstance = createPopper(target, tooltip, options)

      // immediately force a synchronous update to avoid positioning flash
      popperInstance.forceUpdate()
      popperRef.current = popperInstance

      return () => {
        popperInstance.destroy()
        popperRef.current = null
      }
    }
  }, [target, tooltip, arrow, placement, strategy, offset, onStateUpdate])

  return popperRef.current
}
