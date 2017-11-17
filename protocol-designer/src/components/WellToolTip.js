import React from 'react'
import PropTypes from 'prop-types'

import styles from './WellToolTip.css'

WellToolTip.propTypes = {
  wellContent: PropTypes.shape({
    name: PropTypes.string.isRequired,
    volume: PropTypes.number.isRequired,
    individualize: PropTypes.bool.isRequired,
    wellName: PropTypes.string.isRequired,

    ingredientNum: PropTypes.number,
    serializeName: PropTypes.string
  }).isRequired
}

export default function WellToolTip ({wellContent}) {
  return (
    <div className={styles.well_tool_tip}>
      <h1>{wellContent.name}</h1>
      <div className={styles.info_row}>
        <div>
          {wellContent.wellName}
        </div>
        {wellContent.individualize && <div className={styles.instance_name}>
          {wellContent.serializeName || 'Sample'} {wellContent.ingredientNum}
        </div>}
        <div>
          {wellContent.volume} uL
        </div>
        <div>
          {wellContent.concentration || '-'}
        </div>
      </div>
    </div>
  )
}
