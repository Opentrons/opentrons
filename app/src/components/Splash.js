import React from 'react'
import classnames from 'classnames'

import styles from './Splash.css'

const STYLE = classnames('absolute absolute__fill', styles.placeholder)

export default function Splash () {
  return (
    <div className={STYLE} />
  )
}
