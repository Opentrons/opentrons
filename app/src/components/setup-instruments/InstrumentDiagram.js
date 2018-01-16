import React from 'react'
import PropTypes from 'prop-types'

import styles from './instrument.css'

import singleSrc from '../../img/pipetteSingle.png'
import multiSrc from '../../img/pipetteMulti.png'

InstrumentDiagram.propTypes = {
  channels: PropTypes.number
}

export default function InstrumentDiagram (props) {
  const {channels} = props
  const imgSrc = channels === 1
    ? singleSrc
    : multiSrc

  return (
    <div className={styles.pipette_icon}>
      <img src={imgSrc} />
    </div>
  )
}
