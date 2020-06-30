// @flow
import assert from 'assert'
import * as React from 'react'
import cx from 'classnames'
import type { LabwareWell } from '@opentrons/shared-data'
import styles from './Well.css'

import type { WellMouseEvent } from './types'

export type WellProps = {|
  /** if included, overrides the default classname */
  className?: ?string,
  /** fill inline style */
  fill?: ?string,
  /** Well Name (eg 'A1') */
  wellName: string,
  /** well object from labware definition */
  well: LabwareWell,
  /** special class used for drag-to-select functionality. Should not be used for styling */
  selectableWellClass?: string,
  /** Optional callback, called with WellMouseEvent args onMouseOver */
  onMouseEnterWell?: WellMouseEvent => mixed,
  onMouseLeaveWell?: WellMouseEvent => mixed,
|}

function WellComponent(props: WellProps) {
  const { well, wellName, fill, onMouseEnterWell, onMouseLeaveWell } = props
  assert(well, `expected 'well' prop for well "${wellName}"`)
  if (!well) return null
  const { x, y } = well

  const baseClassName = props.className || styles.default_well
  const className = cx(baseClassName, props.selectableWellClass)

  const _mouseInteractionProps = {
    className,
    style: { fill },
    'data-wellname': wellName,
    onMouseEnter: onMouseEnterWell
      ? event => onMouseEnterWell({ wellName, event })
      : null,
    onMouseLeave: onMouseLeaveWell
      ? event => onMouseLeaveWell({ wellName, event })
      : null,
  }
  const _noMouseProps = {
    className: baseClassName,
    style: { fill, pointerEvents: 'none' },
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

export const Well: React.AbstractComponent<WellProps> = React.memo(
  WellComponent
)
