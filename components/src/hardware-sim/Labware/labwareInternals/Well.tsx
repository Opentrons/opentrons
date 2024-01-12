import * as React from 'react'

import type { LabwareWell } from '@opentrons/shared-data'
import type { WellMouseEvent } from './types'
import type { StyleProps } from '../../../primitives'
import { LEGACY_COLORS } from '../../../ui-style-constants'

export const INTERACTIVE_WELL_DATA_ATTRIBUTE = 'data-wellname'
export interface WellProps extends StyleProps {
  /** Well Name (eg 'A1') */
  wellName: string
  /** well object from labware definition */
  well: LabwareWell
  stroke: React.CSSProperties['stroke']
  strokeWidth: React.CSSProperties['strokeWidth']
  fill: React.CSSProperties['fill']
  /** Optional callback, called with WellMouseEvent args onMouseOver */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
}

export function WellComponent(props: WellProps): JSX.Element {
  const {
    well,
    wellName,
    stroke = COLORS.black90,
    strokeWidth = 1,
    fill = COLORS.white,
    onMouseEnterWell,
    onMouseLeaveWell,
  } = props
  const { x, y } = well

  const isInteractive = onMouseEnterWell != null || onMouseLeaveWell != null
  const pointerEvents: React.CSSProperties['pointerEvents'] = isInteractive
    ? 'auto'
    : 'none'
  const commonProps = {
    [INTERACTIVE_WELL_DATA_ATTRIBUTE]: isInteractive ? wellName : undefined,
    onMouseEnter:
      onMouseEnterWell != null
        ? (event: React.MouseEvent) => onMouseEnterWell({ wellName, event })
        : undefined,
    onMouseLeave:
      onMouseLeaveWell != null
        ? (event: React.MouseEvent) => onMouseLeaveWell({ wellName, event })
        : undefined,
    style: { pointerEvents, stroke, strokeWidth, fill },
  }

  if (well.shape === 'circular') {
    const { diameter } = well
    const radius = diameter / 2
    return <circle {...commonProps} cx={x} cy={y} r={radius} />
  }

  const { xDimension, yDimension } = well
  return (
    <rect
      {...commonProps}
      x={x - xDimension / 2}
      y={y - yDimension / 2}
      width={xDimension}
      height={yDimension}
    />
  )
}

export const Well: React.MemoExoticComponent<typeof WellComponent> = React.memo(
  WellComponent
)
