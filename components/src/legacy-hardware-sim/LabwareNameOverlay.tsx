import * as React from 'react'
import cx from 'classnames'
import styles from './LabwareNameOverlay.module.css'

export interface LabwareNameOverlayProps {
  title: string
  subtitle?: string | null | undefined
  className?: string
}

export function LabwareNameOverlay(
  props: LabwareNameOverlayProps
): JSX.Element {
  const { title, subtitle, className } = props

  return (
    <div className={cx(styles.name_overlay, className)}>
      <p className={styles.display_name}> {title} </p>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
