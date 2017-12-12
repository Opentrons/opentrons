import React from 'react'
import cx from 'classnames'
import isNil from 'lodash/isNil'

import styles from './Well.css'
import { SELECTABLE_WELL_CLASS, swatchColors } from './constants.js'
// import WellToolTip from '../components/WellToolTip.js' // TODO bring back tooltip in SVG, somehow

export function Well ({
  wellName,
  groupId,
  selectable,
  selected,
  preselected,
  hasRectWells,
  wellLocation,
  svgOffset
}) {
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
    'data-wellName': wellName,
    style
  }

  return hasRectWells
    // flip x and y coordinates for landscape (default-containers.json is in portrait)
    ? <rect
      {...commonProps}
      x={wellLocation.y + svgOffset.y}
      y={wellLocation.x + svgOffset.x}
      width={wellLocation.length}
      height={wellLocation.width}
    />
    : <circle
      {...commonProps}
      cx={wellLocation.y + svgOffset.y}
      cy={wellLocation.x + svgOffset.x}
      r={wellLocation.diameter / 2}
    />
}
