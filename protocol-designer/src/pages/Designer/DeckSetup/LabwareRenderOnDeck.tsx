import { LabwareRender } from '@opentrons/components'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { ReactNode } from 'react'

interface LabwareRenderOnDeckProps {
  labwareDef: LabwareDefinition2
  x: number
  y: number
}
export function LabwareRenderOnDeck(
  props: LabwareRenderOnDeckProps
): ReactNode {
  const { x, y, labwareDef } = props
  return (
    <g transform={`translate(${x}, ${y})`}>
      <LabwareRender definition={labwareDef} positioningMode="offsetInSlot" />
    </g>
  )
}
