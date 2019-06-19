// @flow
import * as React from 'react'
import styles from './LabwareNameOverlay.css'

type Props = {
  title: string,
  subtitle?: ?string,
}

export default function LabwareNameOverlay(props: Props) {
  const { title, subtitle } = props

  return (
    <div className={styles.name_overlay}>
      <p className={styles.display_name}> {title} </p>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
