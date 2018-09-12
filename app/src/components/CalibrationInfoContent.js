// @flow
import * as React from 'react'
import styles from './calibration-info.css'

type Props = {
  leftChildren?: React.Node,
  rightChildren?: React.Node,
}

export default function CalibrationInfoContent (props: Props) {
  const {leftChildren, rightChildren} = props

  return (
    <div className={styles.info_wrapper}>
      <div className={styles.info_left}>
        {leftChildren}
      </div>
      <div className={styles.info_right}>
        {rightChildren}
      </div>
    </div>
  )
}
