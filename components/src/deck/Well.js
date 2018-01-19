// @flow
import React from 'react'
import cx from 'classnames'
import isNil from 'lodash/isNil'

import styles from './Well.css'
import { SELECTABLE_WELL_CLASS, swatchColors } from '../constants.js'
// import WellToolTip from '../components/WellToolTip.js' // TODO bring back tooltip in SVG, somehow

type Props = {
  wellName: string,
  groupId: string, // TODO Ian 2017-12-13 groupId represents an Ingredient Group ID, should be handled outside of this component.
  selectable: boolean,
  selected: boolean,
  preselected: boolean,
  wellLocation: {
    x: number,
    y: number,
    length?: number,
    width?: number,
    diameter?: number
  },
  svgOffset: {
    x: number,
    y: number
  }
}

export default function Well (props: Props) {
  const {
    wellName,
    groupId,
    selectable,
    selected,
    preselected,
    wellLocation,
    svgOffset
  } = props

  const isFilled = !isNil(groupId)

  const className = cx(styles.well, {
    [SELECTABLE_WELL_CLASS]: selectable,
    [styles.selected]: selected,
    [styles.preselected]: preselected
  })

  const style = {
    '--fill-color': isFilled
      ? swatchColors(parseInt(groupId, 10))
      : 'transparent'
  }

  const commonProps = {
    className,
    'data-wellname': wellName,
    style
  }

  const isRect = typeof wellLocation.length === 'number' && typeof wellLocation.width === 'number'
  const isCircle = typeof wellLocation.diameter === 'number'

  // flip x and y coordinates for landscape (default-containers.json is in portrait)
  // TODO: Ian 2017-12-13 is there a better way to tell flow:
  // "if this has diameter, it's circleWell type. if this has length & widht, it's rectWell type" ?
  if (isRect) {
    return <rect
      {...commonProps}
      x={wellLocation.y + svgOffset.y}
      y={wellLocation.x + svgOffset.x}
      width={wellLocation.length}
      height={wellLocation.width}
    />
  }

  if (isCircle) {
    return <circle
      {...commonProps}
      cx={wellLocation.y + svgOffset.y}
      cy={wellLocation.x + svgOffset.x}
      r={(wellLocation.diameter || 0) / 2}
    />
  }

  console.warn('Invalid well: neither rectangle or circle: ' + JSON.stringify(wellLocation))
}
