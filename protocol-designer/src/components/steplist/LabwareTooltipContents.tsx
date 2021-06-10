// @flow
import * as React from 'react'
import styles from './StepItem.css'

type LabwareTooltipContentsProps = {
  labwareNickname: string | null | undefined
}
export const LabwareTooltipContents = (
  props: LabwareTooltipContentsProps
): React.ReactNode => {
  const { labwareNickname } = props
  return (
    <div className={styles.labware_tooltip_contents}>
      <p className={styles.labware_name}>{labwareNickname}</p>
    </div>
  )
}
