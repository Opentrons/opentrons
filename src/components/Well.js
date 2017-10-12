import React from 'react'
import PropTypes from 'prop-types'

import styles from '../css/style.css'

const Well = ({x, y, wellContent, ...otherProps}) => {
  const { preselected, selected, number } = wellContent
  return (
    <div
      className={styles.wellRound}
      data-well-number={number}
      data-well-x={x}
      data-well-y={y}
      style={{
        '--well-selection-color': selected
        ? 'gray'
        : (preselected ? 'lightblue' : 'transparent'),
        '--well-color': 'white'}} // <- set well color here (probably, add it in wellMatrix)

      {...otherProps}
      />
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
