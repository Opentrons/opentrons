import React from 'react'
// import PropTypes from 'prop-types' // TODO
import cx from 'classnames'

import styles from './Well.css'
import { SELECTABLE_WELL_CLASS, swatchColors } from '../constants.js'
// import WellToolTip from '../components/WellToolTip.js' // TODO bring back tooltip in SVG, somehow

export default function Well ({
  wellName,
  groupId,
  selectable,
  selected,
  preselected,
  hasRectWells,
  wellLocation,
  svgOffset
}) {
  const isFilled = (groupId !== null && groupId !== undefined) // TODO use !isNil(groupId)

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

// TODO: remove. No longer used in SVG deckmap.
// import styles from '../css/style.css' // TODO use own styles
//
// Well.propTypes = {
//   x: PropTypes.number.isRequired,
//   y: PropTypes.number.isRequired,
//   wellContent: PropTypes.shape({
//     number: PropTypes.number,
//     selected: PropTypes.bool,
//     preselected: PropTypes.bool,
//     highlighted: PropTypes.bool,
//     hovered: PropTypes.bool,
//     groupId: PropTypes.string
//   }).isRequired
// }
//
// export default function Well ({x, y, wellContent, selectable, ...otherProps}) {
//   const { preselected, selected, highlighted, hovered, groupId } = wellContent
//   const isFilled = (groupId !== null && groupId !== undefined)
//   return (
//     <div
//       className={cx(
//         styles.well_round,
//         {[styles.selected]:
//           selected,
//           [styles.preselected]: preselected,
//           [styles.highlighted]: highlighted,
//           [SELECTABLE_WELL_CLASS]: selectable && !isFilled}
//       )}
//       data-well-x={x}
//       data-well-y={y}
//       style={{
//         '--well-selection-color': selected
//           ? 'blue' // <- set color swatch for ingredient here
//           : (preselected ? 'lightcyan' : 'transparent'),
//         '--well-fill-color': isFilled
//           ? swatchColors(parseInt(groupId, 10))
//           : 'transparent'  // <- set well fill color here (probably, add it in wellContents)
//       }}
//       {...otherProps}
//       >
//       {/* TODO: hovered prop */}
//       {hovered && isFilled && <WellToolTip wellContent={wellContent} />}
//       <div className={styles.inner_well} /></div>
//   )
// }
