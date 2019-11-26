// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './LabwareNameOverlay.css'

type Props = {
  title: string,
  subtitle?: ?string,
  className?: string,
}

export default function LabwareNameOverlay(props: Props) {
  const { title, subtitle, className } = props

  return (
    <div className={cx(styles.name_overlay, className)}>
      <p className={styles.display_name}> {title} </p>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
