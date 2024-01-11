import * as React from 'react'

import { COLORS } from '@opentrons/components'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

interface LabwareDisabledOverlayProps {
  definition: LabwareDefinition2
}
export function LabwareDisabledOverlay({
  definition,
}: LabwareDisabledOverlayProps): JSX.Element {
  return (
    <g>
      <rect
        data-testid="overlay_rect"
        x={0}
        y={0}
        width={definition.dimensions.xDimension}
        height={definition.dimensions.yDimension}
        rx={6}
        fill={COLORS.white}
        fillOpacity={0.9}
      />
      <path
        data-testid="overlay_icon"
        transform={`translate(${
          definition.dimensions.xDimension / 2 - 22.25
        }, ${
          definition.dimensions.yDimension / 2 - 22.25
        }) rotate(90, 22.25, 22.25) scale(2)`}
        d="M3.79834 19.46C1.87784 17.5093 0.692857 14.8323 0.692857 11.8785C0.692857 5.90992 5.53138 1.0714 11.5 1.0714C17.4686 1.0714 22.3071 5.90992 22.3071 11.8785C22.3071 17.8472 17.4686 22.6857 11.5 22.6857C8.71384 22.6857 6.17393 21.6314 4.25749 19.8999L19.5123 4.64514L19.0627 4.19562L3.79834 19.46Z"
        stroke={COLORS.errorEnabled}
        strokeWidth="0.635714"
        fill="none"
      />
    </g>
  )
}
