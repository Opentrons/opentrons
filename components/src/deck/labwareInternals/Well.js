// @flow
import assert from 'assert'
import * as React from 'react'
import cx from 'classnames'
import styles from './Well.css'

import { getIsTiprack, type LabwareDefinition2 } from '@opentrons/shared-data'

type WellProps = {|
  /** if included, overrides the default classname */
  className?: ?string,
  /** fill inline style */
  fill?: ?string,
  /** forces tiprack wells to not render inner circle */
  noInnerTipCircle?: boolean,
  definition: LabwareDefinition2,
  /** Well Name (eg 'A1') */
  wellName: string,
  /** special class used for drag-to-select functionality. Should not be used for styling */
  selectableWellClass?: string,
  /** Optional callback, called with well name onMouseOver */
  onMouseOverWell?: (wellName: string) => mixed,
|}

export default function Well(props: WellProps) {
  const { definition, wellName, fill, onMouseOverWell } = props

  if (!definition.wells[wellName]) {
    assert(
      false,
      `Well ${wellName} does not exist in definition ${definition.otId}`
    )
    return null
  }

  const well = definition.wells[wellName]
  const { cornerOffsetFromSlot } = definition
  const isTip = getIsTiprack(definition) && !props.noInnerTipCircle

  const baseClassName =
    props.className || cx(styles.default_well, { [styles.tip]: isTip })
  const className = cx(baseClassName, props.selectableWellClass)

  const _mouseInteractionProps = {
    className,
    style: { fill },
    'data-well-name': wellName,
    onMouseOver: onMouseOverWell ? () => onMouseOverWell(wellName) : null,
  }
  const noMouseProps = {
    className: baseClassName,
    style: { fill, pointerEvents: 'none' },
  }
  // exclude all mouse interactivity props if no onMouseOverWell provided
  const commonProps = onMouseOverWell ? _mouseInteractionProps : noMouseProps

  // TODO(mc, 2019-04-04): cornerOffsetFromSlot is added to x and y because
  //   labware render is currently in slot coordinate system; revisit this
  //   decision when deck component refactor is in progress
  const x = well.x + cornerOffsetFromSlot.x
  const y = well.y + cornerOffsetFromSlot.y

  if (well.shape === 'circular') {
    const { diameter } = well
    const radius = diameter / 2
    // TODO(mc, 2019-03-27): figure out tip rendering; see:
    //   components/src/deck/Well.js
    //   components/src/deck/Tip.js
    return (
      <>
        <circle {...commonProps} cx={x} cy={y} r={radius} />
        {/* NOTE: tip inner circle never gets mouse interaction props */}
        {isTip && <circle {...noMouseProps} cx={x} cy={y} r={radius - 1} />}
      </>
    )
  }

  if (well.shape === 'rectangular') {
    const { length, width } = well
    return (
      <rect
        {...commonProps}
        x={x - length / 2}
        y={y - width / 2}
        width={length}
        height={width}
      />
    )
  }

  console.warn('Invalid well', well)
  return null
}
