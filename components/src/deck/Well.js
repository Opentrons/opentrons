// @flow
import React from 'react'
import cx from 'classnames'

import styles from './Well.css'
import {SELECTABLE_WELL_CLASS} from '../constants.js'
// import WellToolTip from '../components/WellToolTip.js' // TODO bring back tooltip in SVG, somehow

export type SingleWell = {|
  highlighted: boolean, // highlighted is the same as hovered
  selected: boolean,
  error: boolean,
  wellName: string,
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
  selectable: boolean,
  wellLocation: WellLocation,
  svgOffset: {
    x: number,
    y: number
  },
  onMouseOver?: (e: SyntheticMouseEvent<*>) => mixed
}

export default function Well (props: Props) {
  const {
    wellName,
    selectable,
    highlighted,
    selected,
    error,
    wellLocation,
    svgOffset,
    onMouseOver
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
    onMouseOver
  }

  const isRect = typeof wellLocation.length === 'number' && typeof wellLocation.width === 'number'
  const isCircle = typeof wellLocation.diameter === 'number'

  // flip x and y coordinates for landscape (default-containers.json is in portrait)
  // TODO: Ian 2017-12-13 is there a better way to tell flow:
  // "if this has diameter, it's circleWell type. if this has length & width, it's rectWell type" ?
  if (isRect) {
    const rectProps = {
      x: wellLocation.y + svgOffset.y,
      y: wellLocation.x + svgOffset.x,
      width: wellLocation.length,
      height: wellLocation.width
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
      cx: wellLocation.y + svgOffset.y,
      cy: wellLocation.x + svgOffset.x,
      r: (wellLocation.diameter || 0) / 2
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
    </g>
  }

  console.warn('Invalid well: neither rectangle or circle: ' + JSON.stringify(wellLocation))
}
