import * as React from 'react'
import styles from './StepItem.module.css'

interface LabwareTooltipContentsProps {
  labwareNickname?: string | null
}
export const LabwareTooltipContents = (
  props: LabwareTooltipContentsProps
): JSX.Element => {
  const { labwareNickname } = props
  return (
    <div className={styles.labware_tooltip_contents}>
      <p className={styles.labware_name}>{labwareNickname}</p>
    </div>
  )
}
