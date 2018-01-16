import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import InfoItem from './InfoItem.js' // move to comp lib?
import InstrumentDiagram from './InstrumentDiagram.js'

import styles from './instrument.css'

InstrumentInfo.propTypes = {
  axis: PropTypes.string.isRequired,
  channels: PropTypes.number,
  isDisabled: PropTypes.bool,
  description: PropTypes.string.isRequired,
  tipType: PropTypes.string.isRequired
}

export default function InstrumentInfo (props) {
  const {axis, channels, isDisabled, description, tipType} = props
  const className = classnames(styles.pipette, styles[axis], {
    [styles.disabled]: isDisabled
  })

  return (
    <div className={className}>
      <div className={styles.pipette_info}>
        <InfoItem title={'pipette'} value={description} />
        <InfoItem title={'suggested tip type'} value={tipType} />
      </div>
      <InstrumentDiagram channels={channels} />
    </div>
  )
}
