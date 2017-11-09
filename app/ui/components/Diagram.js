import React from 'react'
import PropTypes from 'prop-types'

import styles from './Diagram.css'
import plateSingleSrc from '../img/labware/plate_single.png'
import troughSingleSrc from '../img/labware/trough_single.png'
import tubeSingleSrc from '../img/labware/tuberack_single.png'
import tiprackSingleSrc from '../img/labware/tiprack_single.png'

Diagram.propTypes = {
  isTiprack: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired
}

export default function Diagram (props) {
  const {isTiprack, type} = props
  let labwareSrc

  if (isTiprack) {
    labwareSrc = tiprackSingleSrc
  } else if (type.includes('trough')) {
    labwareSrc = troughSingleSrc
  } else if (type.includes('tube-rack')) {
    labwareSrc = tubeSingleSrc
  } else {
    labwareSrc = plateSingleSrc
  }

  return (
    <img className={styles.diagram} src={labwareSrc} />
  )
}
