import { useLayoutEffect } from 'react'
import { createPopper } from '@popperjs/core'

import type { VirtualElement } from '@popperjs/core'

const WELL_BORDER_WIDTH = 4

export interface WellReferenceRect {
  left: number
  top: number
  width: number
  height: number
}

function createWellVirtualReference(
  referenceRect: WellReferenceRect
): VirtualElement {
  return {
    getBoundingClientRect: () => {
      const { left, top, width, height } = referenceRect
      const x = left + width / 2
      const y = top + height / 3

      return {
        width: 0,
        height: 0,
        top: y,
        left: x,
        right: x,
        bottom: y,
        x,
        y,
        toJSON: () => ({}),
      }
    },
  }
}

export function useWellTooltipPopper(
  tooltipEl: HTMLElement | null,
  referenceRect: WellReferenceRect | null
): void {
  useLayoutEffect(() => {
    if (tooltipEl == null || referenceRect == null) {
      return
    }

    const virtualReference = createWellVirtualReference(referenceRect)
    const offset = referenceRect.height / 2 + WELL_BORDER_WIDTH * 2

    const popperInstance = createPopper(virtualReference, tooltipEl, {
      placement: 'bottom',
      strategy: 'fixed',
      modifiers: [
        {
          name: 'offset',
          options: { offset: [0, offset] },
        },
      ],
    })

    popperInstance.forceUpdate()

    return () => {
      popperInstance.destroy()
    }
  }, [
    tooltipEl,
    referenceRect?.left,
    referenceRect?.top,
    referenceRect?.width,
    referenceRect?.height,
  ])
}
