// @flow
import * as React from 'react'
import cx from 'classnames'
import styles from './LabwareNameOverlay.css'

export type LabwareNameOverlayProps = {|
  title: string,
  subtitle?: ?string,
  className?: string,
|}

export function LabwareNameOverlay(props: LabwareNameOverlayProps): React.Node {
  const { title, subtitle, className } = props

  return (
    <div className={cx(styles.name_overlay, className)}>
      <p className={styles.display_name}> {title} </p>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
