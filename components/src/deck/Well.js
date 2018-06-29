// @flow
import React from 'react'
import cx from 'classnames'

import styles from './Well.css'
import {SELECTABLE_WELL_CLASS} from '../constants.js'
// import WellToolTip from '../components/WellToolTip.js' // TODO bring back tooltip in SVG, somehow

export type SingleWell = {|
  wellName: string,
  highlighted?: ?boolean, // highlighted is the same as hovered
  selected?: ?boolean,
  error?: ?boolean,
  maxVolume?: number,
  fillColor?: ?string
|}

export type WellLocation = {
  x: number,
  y: number,
  length?: number,
  width?: number,
  diameter?: number
}

type Props = {
  ...SingleWell,
  isTip?: ?boolean,
  selectable: boolean,
  wellLocation: WellLocation,
  svgOffset: {
    x: number,
    y: number
  },
  onMouseOver?: (e: SyntheticMouseEvent<*>) => mixed,
  onMouseLeave?: (e: SyntheticMouseEvent<*>) => mixed
}

export default function Well (props: Props) {
  const {
    wellName,
    selectable,
    isTip,
    highlighted,
    selected,
    error,
    wellLocation,
    svgOffset,
    onMouseOver,
    onMouseLeave
  } = props

  const fillColor = props.fillColor || 'transparent'

  const wellOverlayClassname = cx(
    styles.well_border,
    {
      [SELECTABLE_WELL_CLASS]: selectable,
      [styles.selected]: selected,
      [styles.selected_overlay]: selected,
      [styles.highlighted]: highlighted,
      [styles.error]: error
    }
  )

  const selectionProps = {
    'data-wellname': wellName,
    onMouseOver,
    onMouseLeave
  }

  const isCircle = typeof wellLocation.diameter === 'number'
  const isRect = !isCircle

  if (isRect) {
    const baseY = wellLocation.y + svgOffset.y
    const rectProps = {
      x: wellLocation.x + svgOffset.x,
      y: baseY - (wellLocation.length || 0), // zero fallback for flow
      width: wellLocation.width,
      height: baseY
    }

    if (isTip) {
      console.warn('Well component does not support isTip for rectangular wells (bad labware definition???)')
    }

    return <g>
      {/* Fill contents */}
      <rect
        {...rectProps}
        className={styles.well_fill}
        color={fillColor}
      />
      {/* Border + overlay */}
      <rect
        {...selectionProps}
        {...rectProps}
        className={wellOverlayClassname}
      />
    </g>
  }

  if (isCircle) {
    const circleProps = {
      cx: wellLocation.x + svgOffset.x,
      cy: wellLocation.y + svgOffset.y,
      r: (wellLocation.diameter || 0) / 2
    }

    // smaller circle inside the main circle for tips in a tiprack
    let tipCircle = null
    if (isTip) {
      const radius = (circleProps.r > 3)
        ? circleProps.r * 0.7 // big radius, tipCircle is smaller
        : circleProps.r * 1.75 // small radius, tipCircle is bigger

      const innerCircleProps = {
        ...circleProps,
        r: radius
      }

      tipCircle = <circle
        {...innerCircleProps}
        className={styles.well_border}
      />
    }

    return <g>
      {/* Fill contents */}
      <circle
        {...circleProps}
        className={styles.well_fill}
        color={fillColor}
      />
      {/* Border + overlay */}
      <circle
        {...selectionProps}
        {...circleProps}
        className={wellOverlayClassname}
      />
      {/* Unfilled circle for tips only */}
      {tipCircle}
    </g>
  }

  console.warn('Invalid well: neither rectangle or circle: ' + JSON.stringify(wellLocation))
}
