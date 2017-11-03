import React from 'react'
import PropTypes from 'prop-types'

import styles from './WellToolTip.css'

const WellToolTip = ({wellContent}) => (
  <div className={styles.wellToolTip}>
    <h1>{wellContent.name}</h1>
    <div className={styles.infoRow}>
      {wellContent.individualize && <div className={styles.instanceName}>
        {wellContent.serializeName || 'Sample'} {wellContent.ingredientNum}
      </div>}
      <div>
        {wellContent.wellName}
      </div>
      <div>
        {wellContent.volume} uL
      </div>
      <div>
        {wellContent.concentration || '-'}
      </div>
    </div>
  </div>
)

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

export default WellToolTip
