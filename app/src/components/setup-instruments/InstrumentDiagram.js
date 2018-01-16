import React from 'react'
import styles from './instrument.css'

import singleSrc from '../../img/pipetteSingle.png'
import multiSrc from '../../img/pipetteMulti.png'

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
