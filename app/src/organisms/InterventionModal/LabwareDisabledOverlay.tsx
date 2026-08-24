import { COLORS } from '@opentrons/components'
import { getSchema2Dimensions } from '@opentrons/shared-data'

import type { ReactNode } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

interface LabwareDisabledOverlayProps {
  definition: LabwareDefinition
}
export function LabwareDisabledOverlay({
  definition,
}: LabwareDisabledOverlayProps): ReactNode {
  const { xDimension, yDimension } = getSchema2Dimensions(definition)

  return (
    <g>
      <rect
        data-testid="overlay_rect"
        x={0}
        y={0}
        width={xDimension}
        height={yDimension}
        rx={6}
        fill={COLORS.white}
        fillOpacity={0.9}
      />
      <path
        data-testid="overlay_icon"
        transform={`translate(${xDimension / 2 - 22.25}, ${
          yDimension / 2 - 22.25
        }) rotate(90, 22.25, 22.25) scale(2)`}
        d="M3.79834 19.46C1.87784 17.5093 0.692857 14.8323 0.692857 11.8785C0.692857 5.90992 5.53138 1.0714 11.5 1.0714C17.4686 1.0714 22.3071 5.90992 22.3071 11.8785C22.3071 17.8472 17.4686 22.6857 11.5 22.6857C8.71384 22.6857 6.17393 21.6314 4.25749 19.8999L19.5123 4.64514L19.0627 4.19562L3.79834 19.46Z"
        stroke={COLORS.red50}
        strokeWidth="0.635714"
        fill="none"
      />
    </g>
  )
}
