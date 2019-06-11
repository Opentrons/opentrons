// @flow
import * as React from 'react'
import styles from './LabwareNameOverlay.css'
import RobotCoordsForeignDiv from './RobotCoordsForeignDiv'

type Props = {
  title: string,
  subtitle?: ?string,
}

export default function LabwareNameOverlay(props: Props) {
  const { title, subtitle } = props

  return (
    <RobotCoordsForeignDiv innerDivProps={{ className: styles.name_overlay }}>
      <p className={styles.display_name}> {title} </p>
      {subtitle && <p className={styles.display_name}>{subtitle}</p>}
    </RobotCoordsForeignDiv>
  )
}
