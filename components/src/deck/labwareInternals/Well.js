// @flow
import assert from 'assert'
import * as React from 'react'
import cx from 'classnames'
import styles from './Well.css'

import type { LabwareWell } from '@opentrons/shared-data'

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
  /** Optional callback, called with well name onMouseOver */
  onMouseOverWell?: (wellName: string) => mixed,
|}

function Well(props: WellProps) {
  const { well, wellName, fill, onMouseOverWell } = props
  assert(well, `expected well prop for ${wellName}`)
  if (!well) return null
  const { x, y } = well

  const baseClassName = props.className || styles.default_well
  const className = cx(baseClassName, props.selectableWellClass)

  const _mouseInteractionProps = {
    className,
    style: { fill },
    'data-well-name': wellName,
    onMouseOver: onMouseOverWell ? () => onMouseOverWell(wellName) : null,
  }
  const _noMouseProps = {
    className: baseClassName,
    style: { fill, pointerEvents: 'none' },
  }
  // exclude all mouse interactivity props if no onMouseOverWell provided
  const commonProps = onMouseOverWell ? _mouseInteractionProps : _noMouseProps

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

export default React.memo<WellProps>(Well)
