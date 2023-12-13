import assert from 'assert'
import * as React from 'react'
import cx from 'classnames'
import styles from './Well.module.css'

import type { LabwareWell } from '@opentrons/shared-data'
import type { CSSProperties } from 'styled-components'
import type { WellMouseEvent } from './types'

export interface WellProps {
  /** if included, overrides the default classname */
  className?: string | null | undefined
  /** fill inline style */
  fill?: CSSProperties['fill']
  /** stroke inline style */
  stroke?: CSSProperties['stroke']
  /** Well Name (eg 'A1') */
  wellName: string
  /** well object from labware definition */
  well: LabwareWell
  /** special class used for drag-to-select functionality. Should not be used for styling */
  selectableWellClass?: string
  /** Optional callback, called with WellMouseEvent args onMouseOver */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
}

export function WellComponent(props: WellProps): JSX.Element | null {
  const {
    well,
    wellName,
    fill,
    stroke,
    onMouseEnterWell,
    onMouseLeaveWell,
  } = props
  assert(well, `expected 'well' prop for well "${wellName}"`)
  if (!well) return null
  const { x, y } = well

  const baseClassName = props.className || styles.default_well
  const className = cx(baseClassName, props.selectableWellClass)

  const _mouseInteractionProps = {
    className,
    style: { fill, stroke },
    'data-wellname': wellName,
    onMouseEnter: onMouseEnterWell
      ? ((event =>
          onMouseEnterWell({ wellName, event })) as React.MouseEventHandler)
      : undefined,
    onMouseLeave: onMouseLeaveWell
      ? ((event =>
          onMouseLeaveWell({ wellName, event })) as React.MouseEventHandler)
      : undefined,
  }
  const _noMouseProps = {
    className: baseClassName,
    style: {
      fill,
      stroke,
      pointerEvents: 'none' as CSSProperties['pointerEvents'],
    },
  }
  // exclude all mouse interactivity props if no event handler props provided
  const commonProps =
    onMouseEnterWell || onMouseLeaveWell
      ? _mouseInteractionProps
      : _noMouseProps

  if (well.shape === 'circular') {
    const { diameter } = well
    const radius = diameter / 2
    return <circle {...commonProps} cx={x} cy={y} r={radius} />
  }

  if (well.shape === 'rectangular') {
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

  console.warn('Invalid well', well)
  return null
}

export const Well: React.MemoExoticComponent<typeof WellComponent> = React.memo(
  WellComponent
)
