import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from '../css/style.css'

const Well = ({x, y, wellContent, ...otherProps}) => {
  const { preselected, selected, number } = wellContent
  return (
    <div
      className={cx(styles.wellRound, {[styles.selected]: selected, [styles.highlighted]: preselected})}
      data-well-number={number}
      data-well-x={x}
      data-well-y={y}
      style={{
        '--well-selection-color': selected
          ? 'blue' // <- set color swatch for ingredient here
          : (preselected ? 'lightcyan' : 'transparent'),
        '--well-fill-color': 'transparent'  // <- set well fill color here (probably, add it in wellMatrix)
      }}
      {...otherProps}
      ><div className={styles.innerWell} /></div>
  )
}

Well.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  wellContent: PropTypes.shape({
    number: PropTypes.number,
    selected: PropTypes.bool,
    preselected: PropTypes.bool
  }).isRequired
}

export default Well
