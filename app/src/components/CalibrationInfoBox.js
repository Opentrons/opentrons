// @flow
import * as React from 'react'
import classnames from 'classnames'
import { Icon } from '@opentrons/components'
import styles from './calibration-info.css'

export type CalibrationInfoBoxProps = {|
  title: string,
  confirmed: boolean,
  className?: string,
  children: React.Node,
|}

export function CalibrationInfoBox(props: CalibrationInfoBoxProps) {
  const { className, confirmed, title, children } = props

  const iconName = confirmed ? 'check-circle' : 'checkbox-blank-circle-outline'

  return (
    <section className={classnames(styles.info_box, className)}>
      <div className={styles.info_header}>
        <Icon name={iconName} className={styles.info_header_icon} />
        <h2 className={styles.info_header_title} title={title}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}
