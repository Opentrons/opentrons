import {
  getLabwareViewBox,
  getVectorInverse,
  getVectorSum,
  SLOT_RENDER_HEIGHT,
  SLOT_RENDER_WIDTH,
} from '@opentrons/shared-data'

import type { PropsWithChildren, ReactNode } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

export type CenterLabwareInSlotProps = PropsWithChildren<{
  definition: LabwareDefinition
}>

/**
 * This wraps a `<LabwareRender>` to center it within a standard-sized slot.
 *
 * The parent SVG origin should point to the front-left (-x, -y) corner of the slot.
 */
export function CenterLabwareInSlot(
  props: CenterLabwareInSlotProps
): ReactNode {
  const { definition, children } = props

  const { minX, minY, maxX, maxY } = getLabwareViewBox(definition)
  const labwareOriginToLabwareCenter = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: 0, // The vector math functions are 3D-only for now, so we need this placeholder.
  }
  const labwareCenterToLabwareOrigin = getVectorInverse(
    labwareOriginToLabwareCenter
  )

  // This uses a hard-coded standard slot size. For correctness, we might want to change
  // this to get the slot dimensions from the underlying deck or module definition.
  const slotOriginToSlotCenter = {
    x: SLOT_RENDER_WIDTH / 2,
    y: SLOT_RENDER_HEIGHT / 2,
    z: 0, // The vector math functions are 3D-only for now, so we need this placeholder.
  }

  const slotCenterToLabwareCenter = { x: 0, y: 0, z: 0 }

  const slotOriginToLabwareOrigin = getVectorSum(
    slotOriginToSlotCenter,
    slotCenterToLabwareCenter,
    labwareCenterToLabwareOrigin
  )

  return (
    <g
      transform={`translate(${slotOriginToLabwareOrigin.x} ${slotOriginToLabwareOrigin.y})`}
    >
      {children}
    </g>
  )
}
