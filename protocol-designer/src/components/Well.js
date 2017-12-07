import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import { SELECTABLE_WELL_CLASS, swatchColors } from '../constants.js'
import WellToolTip from '../components/WellToolTip.js'

import styles from '../css/style.css' // TODO use own styles

Well.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  wellContent: PropTypes.shape({
    number: PropTypes.number,
    selected: PropTypes.bool,
    preselected: PropTypes.bool,
    highlighted: PropTypes.bool,
    hovered: PropTypes.bool,
    groupId: PropTypes.string
  }).isRequired
}

export default function Well ({x, y, wellContent, selectable, ...otherProps}) {
  const { preselected, selected, highlighted, hovered, groupId } = wellContent
  const isFilled = (groupId !== null && groupId !== undefined)
  return (
    <div
      className={cx(
        styles.well_round,
        {[styles.selected]:
          selected,
          [styles.preselected]: preselected,
          [styles.highlighted]: highlighted,
          [SELECTABLE_WELL_CLASS]: selectable && !isFilled}
      )}
      data-well-x={x}
      data-well-y={y}
      style={{
        '--well-selection-color': selected
          ? 'blue' // <- set color swatch for ingredient here
          : (preselected ? 'lightcyan' : 'transparent'),
        '--well-fill-color': isFilled
          ? swatchColors(parseInt(groupId, 10))
          : 'transparent'  // <- set well fill color here (probably, add it in wellMatrix)
      }}
      {...otherProps}
      >
      {/* TODO: hovered prop */}
      {hovered && isFilled && <WellToolTip wellContent={wellContent} />}
      <div className={styles.inner_well} /></div>
  )
}
