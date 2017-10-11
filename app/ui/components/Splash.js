import React from 'react'
import styles from './Splash.css'
import otLogoSrc from '../img/opentrons_logo.png'

export default function Splash () {
  return (
    <div className={styles.placeholder}>
      <img src={otLogoSrc} />
    </div>
  )
}
